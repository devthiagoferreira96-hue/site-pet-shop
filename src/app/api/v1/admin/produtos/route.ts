import { exigirAdmin, lerJson, ok, rota, ErroHttp } from "@/server/http";
import { listarAdmin, produtoAdminSchema, salvarProduto } from "@/server/services/produtos";

export const GET = rota(async (req) => {
  await exigirAdmin(req);
  return ok(await listarAdmin(req.nextUrl.searchParams.get("q") ?? ""));
});

export const POST = rota(async (req) => {
  const admin = await exigirAdmin(req);
  const r = await salvarProduto(await lerJson(req, produtoAdminSchema), null, admin.id);
  if ("erros" in r) throw new ErroHttp(422, "Verifique os campos destacados.", r.erros);
  return ok(r, 201);
});
