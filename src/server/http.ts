/**
 * Utilitários das rotas da API (/api/v1). Formato padrão das respostas:
 *   sucesso: { "dados": ... }
 *   erro:    { "erro": { "mensagem": "...", "campos": { "email": "..." } } }
 */
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { errosPorCampo } from "@/domain/validacao";
import { LimiteTentativas } from "@/domain/seguranca";
import { validarCredencial, type AdminAutenticado } from "./services/auth";

export const COOKIE_SESSAO = process.env.NODE_ENV === "production" ? "__Host-ma_sessao" : "ma_sessao";

export const ok = (dados: unknown, status = 200) => NextResponse.json({ dados }, { status, headers: { "Cache-Control": "no-store" } });
export const erro = (status: number, mensagem: string, campos?: Record<string, string>) =>
  NextResponse.json({ erro: { mensagem, ...(campos ? { campos } : {}) } }, { status, headers: { "Cache-Control": "no-store" } });

export class ErroHttp extends Error {
  constructor(public status: number, mensagem: string, public campos?: Record<string, string>) { super(mensagem); }
}

/** Lê e valida o corpo JSON com um schema Zod. Erros viram 422 com mensagens por campo. */
export async function lerJson<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  let corpo: unknown;
  try { corpo = await req.json(); } catch { throw new ErroHttp(400, "Corpo da requisição precisa ser JSON válido."); }
  const r = schema.safeParse(corpo);
  if (!r.success) throw new ErroHttp(422, "Verifique os campos destacados.", errosPorCampo(r.error));
  return r.data;
}

/** Envolve a rota: transforma erros em respostas padronizadas e nunca vaza detalhes internos. */
export function rota<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof ErroHttp) return erro(e.status, e.message, e.campos);
      if (e instanceof ErroRobo) return ok({ mensagem: "Recebido." }, 201);
      if (e instanceof ZodError) return erro(422, "Verifique os campos destacados.", errosPorCampo(e));
      // Log SEM dados pessoais: erros do banco trazem a consulta e os parâmetros (que podem ter CPF, e-mail...).
      console.error("[api]", req.method, req.nextUrl.pathname, resumoErro(e));
      return erro(500, "Erro inesperado. Tente novamente em instantes.");
    }
  };
}

/** Resume um erro para o log sem vazar dados: só tipo, código e a 1ª linha da mensagem, sem "params:". */
export function resumoErro(e: unknown): string {
  const err = e as { name?: string; code?: string; message?: string; cause?: { code?: string; message?: string } };
  const limpar = (m?: string) => (m ?? "").split("\n")[0].replace(/params:.*$/i, "[parâmetros ocultos]").slice(0, 200);
  const causa = err?.cause ? ` | causa: ${err.cause.code ?? ""} ${limpar(err.cause.message)}` : "";
  return `${err?.name ?? "Erro"}${err?.code ? ` (${err.code})` : ""}: ${limpar(err?.message)}${causa}`;
}

/**
 * Recusa corpos grandes ANTES de ler (evita estourar memória com uploads gigantes).
 * O tamanho real do arquivo também é conferido depois de ler.
 */
export function limitarTamanho(req: NextRequest, maxBytes: number) {
  const tamanho = Number(req.headers.get("content-length") ?? "0");
  if (!tamanho) throw new ErroHttp(411, "Envie o tamanho do arquivo (Content-Length).");
  if (tamanho > maxBytes) throw new ErroHttp(413, `Arquivo muito grande (máximo ${Math.round(maxBytes / 1024 / 1024)} MB).`);
}

/**
 * Proteção contra robôs nos formulários públicos:
 *  1. campo-armadilha "site" (invisível para pessoas; robôs preenchem) -> descarta em silêncio;
 *  2. Cloudflare Turnstile (opcional): se TURNSTILE_SECRET estiver no .env, exige o token "humano" válido.
 * Os limites de envio por IP (limitarPublico) completam a proteção.
 */
export async function verificarHumano(req: NextRequest, corpo: { site?: string; humano?: string }) {
  if (corpo.site) throw new ErroRobo();
  const segredo = process.env.TURNSTILE_SECRET;
  if (!segredo) return;
  if (!corpo.humano) throw new ErroHttp(422, "Confirme que você não é um robô.", { humano: "Confirme que você não é um robô." });
  const form = new URLSearchParams({ secret: segredo, response: corpo.humano, remoteip: ipDe(req) });
  let ok = false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, signal: AbortSignal.timeout(5000) });
    ok = Boolean(((await r.json()) as { success?: boolean }).success);
  } catch { ok = false; }
  if (!ok) throw new ErroHttp(422, "Não conseguimos confirmar que você não é um robô. Tente de novo.", { humano: "Tente de novo." });
}
/** Robô detectado pelo campo-armadilha: a rota responde "sucesso" falso e não grava nada. */
export class ErroRobo extends Error {}

export function ipDe(req: NextRequest): string {
  // Só confie em X-Forwarded-For se o site estiver atrás de um proxy seu (Nginx, Vercel, Render...).
  if (process.env.CONFIAR_PROXY === "1") return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  return req.headers.get("x-real-ip") || "desconhecido";
}

/** Limite de envios dos formulários públicos (anti-spam/abuso). */
const limitePublico = new LimiteTentativas(20, 10 * 60 * 1000);
export function limitarPublico(req: NextRequest, rotaNome: string) {
  const chave = `${rotaNome}:${ipDe(req)}`;
  if (limitePublico.excedido(chave)) throw new ErroHttp(429, "Muitas tentativas. Aguarde alguns minutos.");
  limitePublico.registrar(chave);
}

/**
 * Proteção CSRF para requisições autenticadas por COOKIE (site): exige que a origem seja o próprio site.
 * O app usa "Authorization: Bearer", que o navegador nunca envia sozinho — então não precisa desta checagem.
 */
function origemConfiavel(req: NextRequest): boolean {
  const origem = req.headers.get("origin");
  if (!origem) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try { return new URL(origem).host === host; } catch { return false; }
}

/** Exige admin autenticado (cookie no site ou Bearer no app). */
export async function exigirAdmin(req: NextRequest): Promise<AdminAutenticado> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const admin = await validarCredencial(auth.slice(7).trim(), "access");
    if (!admin) throw new ErroHttp(401, "Token inválido ou expirado. Renove com o refresh token.");
    return admin;
  }
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const admin = await validarCredencial(token, "web");
  if (!admin) throw new ErroHttp(401, "Faça login para continuar.");
  if (req.method !== "GET" && req.method !== "HEAD" && !origemConfiavel(req))
    throw new ErroHttp(403, "Origem da requisição não permitida.");
  return admin;
}

export function definirCookieSessao(res: NextResponse, token: string, maxAgeSeg: number) {
  res.cookies.set(COOKIE_SESSAO, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: maxAgeSeg,
  });
}
export function apagarCookieSessao(res: NextResponse) {
  res.cookies.set(COOKIE_SESSAO, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export const idNumerico = (v: string) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ErroHttp(404, "Não encontrado.");
  return n;
};
