import { erro, ok, rota } from "@/server/http";
import { obterPublico } from "@/server/services/produtos";

export const GET = rota<{ params: Promise<{ slug: string }> }>(async (_req, { params }) => {
  const p = await obterPublico((await params).slug);
  return p ? ok(p) : erro(404, "Produto não encontrado.");
});
