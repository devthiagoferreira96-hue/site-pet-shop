import { limitarTamanho, ErroHttp, exigirAdmin, ok, rota } from "@/server/http";
import { historicoImportacoes, importarPlanilha } from "@/server/services/estoque";

export const GET = rota(async (req) => {
  await exigirAdmin(req);
  return ok(await historicoImportacoes());
});

/** multipart/form-data com o campo "planilha" (.xlsx ou .csv exportado do SimplesVet). */
export const POST = rota(async (req) => {
  const admin = await exigirAdmin(req);
  limitarTamanho(req, 6 * 1024 * 1024);
  const arquivo = (await req.formData()).get("planilha");
  if (!(arquivo instanceof File) || !arquivo.size) throw new ErroHttp(422, "Selecione o arquivo exportado do SimplesVet.");
  if (arquivo.size > 5 * 1024 * 1024) throw new ErroHttp(413, "Arquivo muito grande (máximo 5 MB).");
  try { return ok(await importarPlanilha(arquivo.name, await arquivo.arrayBuffer(), admin.id)); }
  catch (e) { if (e instanceof Error && !(e instanceof ErroHttp)) throw new ErroHttp(422, e.message); throw e; }
});
