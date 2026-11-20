/**
 * Primitivas de segurança, só com node:crypto (sem dependências).
 *
 * Senhas: scrypt com salt aleatório + comparação em tempo constante.
 * Tokens: aleatórios de 256 bits; no banco guardamos só o SHA-256.
 *   Por que não JWT? O JWT é assinado, NÃO criptografado (qualquer um lê o conteúdo) e não pode
 *   ser revogado antes de expirar. Tokens opacos + tabela no banco permitem revogar na hora
 *   (logout, troca de senha, roubo detectado) e não carregam nenhum dado dentro.
 */
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (senha: string, salt: Buffer, tamanho: number, opcoes: object) => Promise<Buffer>;
const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const chave = await scrypt(senha, salt, 64, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${chave.toString("base64")}`;
}

export async function verificarSenha(senha: string, armazenado: string): Promise<boolean> {
  const partes = armazenado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [, N, r, p, saltB64, chaveB64] = partes;
  const esperado = Buffer.from(chaveB64, "base64");
  const calculado = await scrypt(senha, Buffer.from(saltB64, "base64"), esperado.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** Hash usado quando o e-mail não existe, para o tempo de resposta não revelar quais e-mails são válidos. */
export const HASH_FALSO = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

export const gerarToken = () => randomBytes(32).toString("base64url"); // 256 bits
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const gerarCodigo = (prefixo: string) => `${prefixo}-${randomBytes(4).toString("hex").toUpperCase()}`;

export function iguaisTempoConstante(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Prazos de vida das credenciais. */
export const PRAZOS = {
  sessaoWebAdminMs: 8 * 60 * 60 * 1000,        // site: 8 h absolutas
  accessTokenMs: 15 * 60 * 1000,               // app: 15 min
  refreshTokenMs: 30 * 24 * 60 * 60 * 1000,    // app: 30 dias, com rotação a cada uso
} as const;

/** Limitador simples em memória (1 servidor). Com vários servidores, troque por Redis. */
export class LimiteTentativas {
  private mapa = new Map<string, number[]>();
  constructor(private maximo = 5, private janelaMs = 15 * 60 * 1000) {}
  excedido(chave: string, agora = Date.now()): boolean {
    const lista = (this.mapa.get(chave) ?? []).filter((t) => agora - t < this.janelaMs);
    this.mapa.set(chave, lista);
    return lista.length >= this.maximo;
  }
  registrar(chave: string, agora = Date.now()) { this.mapa.set(chave, [...(this.mapa.get(chave) ?? []), agora]); }
  limpar(chave: string) { this.mapa.delete(chave); }
}
