import { existsSync } from "node:fs";
import path from "node:path";

const EXTENSOES = ["webp", "jpg", "jpeg", "png", "avif"];

/**
 * Foto "de vitrine" guardada em public/img/<pasta>/<slug>.<ext>.
 * Serve para categorias (slug da categoria) e para produtos que ainda não têm foto enviada pelo painel
 * (slug do produto). Se não houver arquivo, devolve null e a tela mostra um bloco liso, sem desenho.
 */
export function fotoLocal(pasta: "produtos" | "categorias", slug: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  for (const ext of EXTENSOES) {
    if (existsSync(path.join(process.cwd(), "public", "img", pasta, `${slug}.${ext}`))) return `/img/${pasta}/${slug}.${ext}`;
  }
  return null;
}
