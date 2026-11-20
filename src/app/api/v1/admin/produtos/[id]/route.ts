import { erro, ErroHttp, exigirAdmin, idNumerico, lerJson, ok, rota } from "@/server/http";
import { obterAdmin, produtoAdminSchema, salvarProduto } from "@/server/services/produtos";

type Ctx = { params: Promise<{ id: string }> };

export const GET = rota<Ctx>(async (req, { params }) => {
  await exigirAdmin(req);
  const p = await obterAdmin(idNumerico((await params).id));
  return p ? ok(p) : erro(404, "Produto não encontrado.");
});

export const PUT = rota<Ctx>(async (req, { params }) => {
  const admin = await exigirAdmin(req);
  const r = await salvarProduto(await lerJson(req, produtoAdminSchema), idNumerico((await params).id), admin.id);
  if ("erros" in r) throw new ErroHttp(422, "Verifique os campos destacados.", r.erros);
  return ok(r);
});
