import { NextResponse } from "next/server";
import { erro, rota } from "@/server/http";
import { lerImagem } from "@/server/services/imagens";

export const GET = rota<{ params: Promise<{ arquivo: string }> }>(async (_req, { params }) => {
  const img = await lerImagem((await params).arquivo);
  if (!img) return erro(404, "Imagem não encontrada.");
  return new NextResponse(new Uint8Array(img), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
});
