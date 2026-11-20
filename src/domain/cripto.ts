/**
 * Criptografia de dados sensíveis no banco (LGPD, art. 46): CPF, telefone, endereço e e-mails.
 *
 *  - AES-256-GCM (autenticada): além de esconder, detecta qualquer alteração no valor cifrado.
 *  - Cada valor leva o "contexto" da coluna (ex.: "pedidos.cpf") como dado autenticado: um valor copiado
 *    de uma coluna para outra não decifra.
 *  - Busca por e-mail sem decifrar: "índice cego" = HMAC-SHA256 do e-mail normalizado, com chave própria.
 *  - Formato salvo: "v1.<iv>.<tag+cifra>" (base64url). Valores antigos sem prefixo são lidos como texto
 *    puro, para a migração (scripts/criptografar-existentes.ts) poder converter os registros já existentes.
 *  - Troca de chave: coloque a chave atual em DADOS_CHAVE_ANTERIOR, uma nova em DADOS_CHAVE e rode
 *    npm run db:criptografar (relê com a antiga e grava com a nova).
 *
 * A chave fica SÓ no .env do servidor (nunca no banco, no Git ou no navegador). Sem ela, o dump do banco é ilegível.
 */
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

const PREFIXO = "v1.";

function lerChave(nome: string): Buffer | null {
  const bruto = (process.env[nome] ?? "").trim();
  if (!bruto) return null;
  const chave = Buffer.from(bruto, "base64");
  if (chave.length !== 32) throw new Error(`${nome} precisa ter 32 bytes em base64. Gere com: npm run gerar-segredos`);
  return chave;
}

function chaves() {
  const atual = lerChave("DADOS_CHAVE");
  if (!atual) throw new Error("Defina DADOS_CHAVE no .env (chave de criptografia dos dados pessoais). Gere com: npm run gerar-segredos");
  const anterior = lerChave("DADOS_CHAVE_ANTERIOR");
  // chaves derivadas: uma para cifrar, outra (independente) para o índice cego
  const derivar = (k: Buffer, uso: string) => Buffer.from(hkdfSync("sha256", k, Buffer.alloc(0), `pet-shop:${uso}`, 32));
  return {
    cifra: derivar(atual, "cifra"),
    cifraAnterior: anterior ? derivar(anterior, "cifra") : null,
    indice: derivar(atual, "indice"),
  };
}

const b64 = (b: Buffer) => b.toString("base64url");

export function cifrar(texto: string | null | undefined, contexto: string): string | null {
  if (texto === null || texto === undefined || texto === "") return texto === "" ? "" : null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chaves().cifra, iv);
  c.setAAD(Buffer.from(contexto));
  const cifra = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return `${PREFIXO}${b64(iv)}.${b64(Buffer.concat([c.getAuthTag(), cifra]))}`;
}

function tentarDecifrar(valor: string, contexto: string, chave: Buffer): string {
  const [, ivB64, dadosB64] = valor.split(".");
  const dados = Buffer.from(dadosB64, "base64url");
  const d = createDecipheriv("aes-256-gcm", chave, Buffer.from(ivB64, "base64url"));
  d.setAAD(Buffer.from(contexto));
  d.setAuthTag(dados.subarray(0, 16));
  return Buffer.concat([d.update(dados.subarray(16)), d.final()]).toString("utf8");
}

/** Decifra. Valores sem prefixo (antigos ou marcadores de anonimização) voltam como estão. */
export function decifrar(valor: string | null | undefined, contexto: string): string | null {
  if (valor === null || valor === undefined) return null;
  if (!estaCifrado(valor)) return valor;
  const k = chaves();
  try { return tentarDecifrar(valor, contexto, k.cifra); }
  catch (e) {
    if (k.cifraAnterior) return tentarDecifrar(valor, contexto, k.cifraAnterior);
    throw new Error(`Não foi possível decifrar ${contexto} (chave errada ou dado adulterado).`, { cause: e });
  }
}

export const estaCifrado = (valor: string | null | undefined) => typeof valor === "string" && valor.startsWith(PREFIXO) && valor.split(".").length === 3;

/** Índice cego: permite achar registros pelo e-mail sem guardar o e-mail em texto puro. */
export function indiceEmail(email: string | null | undefined): string | null {
  const n = (email ?? "").trim().toLowerCase();
  if (!n) return null;
  return createHmac("sha256", chaves().indice).update(n).digest("hex");
}

/** Para o comando gerar-segredos e para conferir a configuração. */
export const gerarChave = () => randomBytes(32).toString("base64");
export function chaveConfigurada(): boolean {
  try { chaves(); return true; } catch { return false; }
}
