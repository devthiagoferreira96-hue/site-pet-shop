/**
 * Autenticação do ADMIN.
 *  - Site: cookie HttpOnly com token opaco (sessão no servidor).
 *  - App:  access token (15 min) + refresh token (30 dias, rotativo, com detecção de reuso).
 * Clientes da loja não têm conta (compra como visitante = menos dados pessoais guardados).
 */
import { randomUUID, type UUID } from "node:crypto";
import { and, eq, gt, isNull, lt, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { admins, credenciais } from "@/db/schema";
import { gerarToken, hashSenha, hashToken, HASH_FALSO, LimiteTentativas, PRAZOS, verificarSenha } from "@/domain/seguranca";
import { auditar } from "./auditoria";

export const limiteLogin = new LimiteTentativas(5, 15 * 60 * 1000);
/** Também limita por CONTA: impede "tentar senhas" de muitos IPs diferentes contra o mesmo e-mail. */
export const limiteLoginConta = new LimiteTentativas(10, 60 * 60 * 1000);
export type AdminAutenticado = { id: number; nome: string; email: string; credencialId: string; tipo: "web" | "access" };

export async function verificarLogin(email: string, senha: string) {
  const [admin] = await db.select().from(admins).where(and(eq(admins.email, email.toLowerCase()), eq(admins.ativo, true))).limit(1);
  // Sempre roda o scrypt, mesmo sem usuário: o tempo de resposta não revela quais e-mails existem.
  const ok = await verificarSenha(senha, admin?.senhaHash ?? HASH_FALSO);
  if (!admin || !ok) return null;
  await db.update(admins).set({ ultimoLogin: new Date() }).where(eq(admins.id, admin.id));
  return { id: admin.id, nome: admin.nome, email: admin.email };
}

async function emitir(adminId: number, tipo: "web" | "access" | "refresh", prazoMs: number, familia?: string) {
  const token = gerarToken();
  await db.insert(credenciais).values({
    id: hashToken(token), tipo, adminId, familia: familia ?? null, expiraEm: new Date(Date.now() + prazoMs),
  });
  return token; // o token em texto puro só existe aqui, a caminho do cliente
}

export const criarSessaoWeb = (adminId: number) => emitir(adminId, "web", PRAZOS.sessaoWebAdminMs);

export async function emitirTokensApp(adminId: number, familia = randomUUID()) {
  const accessToken = await emitir(adminId, "access", PRAZOS.accessTokenMs, familia);
  const refreshToken = await emitir(adminId, "refresh", PRAZOS.refreshTokenMs, familia);
  return { accessToken, refreshToken, tokenType: "Bearer", expiresIn: PRAZOS.accessTokenMs / 1000 };
}

/** Valida um token de sessão web ou access token. Retorna o admin ou null. */
export async function validarCredencial(token: string | undefined | null, tipo: "web" | "access"): Promise<AdminAutenticado | null> {
  if (!token || token.length > 200) return null;
  const id = hashToken(token);
  const [linha] = await db
    .select({ credId: credenciais.id, adminId: admins.id, nome: admins.nome, email: admins.email })
    .from(credenciais)
    .innerJoin(admins, eq(admins.id, credenciais.adminId))
    .where(and(eq(credenciais.id, id), eq(credenciais.tipo, tipo), isNull(credenciais.revogadoEm),
      gt(credenciais.expiraEm, new Date()), eq(admins.ativo, true)))
    .limit(1);
  return linha ? { id: linha.adminId, nome: linha.nome, email: linha.email, credencialId: linha.credId, tipo } : null;
}

/**
 * Troca um refresh token por um par novo (rotação). Se o refresh já tiver sido usado,
 * alguém está reutilizando um token roubado: revoga TODA a família e recusa.
 */
export async function renovarTokensApp(refreshToken: string) {
  if (!refreshToken || refreshToken.length > 200) return null;
  const id = hashToken(refreshToken);
  const [cred] = await db.select().from(credenciais).where(and(eq(credenciais.id, id), eq(credenciais.tipo, "refresh"))).limit(1);
  if (!cred) return null;
  if (cred.usadoEm || cred.revogadoEm) {
    if (cred.familia) await revogarFamilia(cred.familia);
    await auditar(cred.adminId, "refresh_reutilizado", "família de tokens revogada (possível roubo)");
    return null;
  }
  if (cred.expiraEm <= new Date()) return null;
  const [admin] = await db.select().from(admins).where(and(eq(admins.id, cred.adminId), eq(admins.ativo, true))).limit(1);
  if (!admin) return null;
  // marca como usado de forma atômica (evita duas renovações simultâneas com o mesmo token)
  const marcado = await db.update(credenciais).set({ usadoEm: new Date() })
    .where(and(eq(credenciais.id, id), isNull(credenciais.usadoEm))).returning({ id: credenciais.id });
  if (!marcado.length) { if (cred.familia) await revogarFamilia(cred.familia); return null; }
  // o access token antigo da mesma família deixa de valer
  await db.update(credenciais).set({ revogadoEm: new Date() })
    .where(and(eq(credenciais.familia, cred.familia!), eq(credenciais.tipo, "access"), isNull(credenciais.revogadoEm)));
  return emitirTokensApp(admin.id, (cred.familia ?? undefined) as UUID | undefined);
}

export async function revogarFamilia(familia: string) {
  await db.update(credenciais).set({ revogadoEm: new Date() }).where(and(eq(credenciais.familia, familia), isNull(credenciais.revogadoEm)));
}

/** Logout: revoga a credencial usada (e, no app, toda a família de tokens). */
export async function sair(auth: AdminAutenticado) {
  const [cred] = await db.select().from(credenciais).where(eq(credenciais.id, auth.credencialId)).limit(1);
  if (cred?.familia) await revogarFamilia(cred.familia);
  else await db.update(credenciais).set({ revogadoEm: new Date() }).where(eq(credenciais.id, auth.credencialId));
  await auditar(auth.id, "logout");
}

/** Encerra todas as sessões/tokens do admin, menos a atual (no app, mantém a família atual). */
export async function encerrarOutras(auth: AdminAutenticado) {
  const [atual] = await db.select().from(credenciais).where(eq(credenciais.id, auth.credencialId)).limit(1);
  const foraDaFamiliaAtual = atual?.familia
    ? or(isNull(credenciais.familia), ne(credenciais.familia, atual.familia))
    : ne(credenciais.id, auth.credencialId);
  const r = await db.update(credenciais).set({ revogadoEm: new Date() })
    .where(and(eq(credenciais.adminId, auth.id), isNull(credenciais.revogadoEm), ne(credenciais.id, auth.credencialId), foraDaFamiliaAtual))
    .returning({ tipo: credenciais.tipo });
  // conta "sessões": cada sessão web = 1; cada login no app gera access+refresh, contamos os refresh
  const encerradas = r.filter((c) => c.tipo !== "access").length;
  await auditar(auth.id, "encerrou_outras_sessoes", String(encerradas));
  return encerradas;
}

export async function trocarSenha(auth: AdminAutenticado, atual: string, nova: string) {
  const [admin] = await db.select().from(admins).where(eq(admins.id, auth.id)).limit(1);
  if (!admin || !(await verificarSenha(atual, admin.senhaHash))) return { ok: false as const, erro: "Senha atual incorreta." };
  await db.update(admins).set({ senhaHash: await hashSenha(nova) }).where(eq(admins.id, auth.id));
  const encerradas = await encerrarOutras(auth);
  await auditar(auth.id, "trocou_senha", `outras sessões encerradas: ${encerradas}`);
  return { ok: true as const, encerradas };
}

export async function limparCredenciaisVencidas() {
  const r = await db.delete(credenciais).where(lt(credenciais.expiraEm, new Date(Date.now() - 24 * 3600 * 1000))).returning({ id: credenciais.id });
  return r.length;
}
