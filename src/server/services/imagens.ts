/**
 * Upload de imagens de produtos. A imagem é validada, redimensionada e recompactada com sharp
 * (isso também remove metadados como localização GPS). Ficam fora da pasta public, servidas pela
 * rota /api/v1/imagens/[arquivo] (no Next, arquivos criados em public depois do build não são servidos).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const PASTA_UPLOADS = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const TAMANHO_MAX = 3 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const NOME_SEGURO = /^[a-f0-9]{16}\.webp$/;

export async function salvarImagem(arquivo: File): Promise<string> {
  if (!TIPOS.has(arquivo.type)) throw new Error("Envie uma imagem JPG, PNG ou WEBP.");
  if (arquivo.size > TAMANHO_MAX) throw new Error("Imagem muito grande. O limite é 3 MB.");
  const sharp = (await import("sharp")).default;
  let saida: Buffer;
  try {
    saida = await sharp(Buffer.from(await arquivo.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate() // respeita a orientação da câmera antes de descartar os metadados
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("Arquivo de imagem inválido ou corrompido.");
  }
  const nome = `${randomBytes(8).toString("hex")}.webp`;
  await mkdir(PASTA_UPLOADS, { recursive: true });
  await writeFile(path.join(PASTA_UPLOADS, nome), saida);
  return nome;
}

export async function lerImagem(nome: string): Promise<Buffer | null> {
  if (!NOME_SEGURO.test(nome)) return null; // impede "../../" e qualquer outro arquivo do servidor
  try { return await readFile(path.join(PASTA_UPLOADS, nome)); } catch { return null; }
}
