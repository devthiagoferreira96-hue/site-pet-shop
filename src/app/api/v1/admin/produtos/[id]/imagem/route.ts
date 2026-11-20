import { limitarTamanho, erro, ErroHttp, exigirAdmin, idNumerico, ok, rota } from "@/server/http";
import { definirImagem, obterAdmin } from "@/server/services/produtos";
import { salvarImagem } from "@/server/services/imagens";

/** multipart/form-data: imagem, alt, fonte, licencaOk=1. Sem origem/licença e texto alternativo, não aceita. */
export const POST = rota<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await exigirAdmin(req);
  limitarTamanho(req, 4 * 1024 * 1024);
  const id = idNumerico((await params).id);
  if (!(await obterAdmin(id))) return erro(404, "Produto não encontrado.");
  const form = await req.formData();
  const arquivo = form.get("imagem");
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  const fonte = String(form.get("fonte") ?? "").trim().slice(0, 200);
  const campos: Record<string, string> = {};
  if (!(arquivo instanceof File) || !arquivo.size) campos.imagem = "Selecione uma imagem.";
  if (!alt) campos.alt = "Descreva a imagem (texto alternativo).";
  if (!fonte) campos.fonte = "Informe a origem/licença da imagem.";
  if (form.get("licencaOk") !== "1") campos.licencaOk = "Confirme que a empresa tem direito de usar esta imagem.";
  if (Object.keys(campos).length) throw new ErroHttp(422, "Verifique os campos destacados.", campos);
  let nome: string;
  try { nome = await salvarImagem(arquivo as File); }
  catch (e) { throw new ErroHttp(422, (e as Error).message, { imagem: (e as Error).message }); }
  await definirImagem(id, nome, alt, fonte, admin.id);
  return ok({ imagem: nome });
});
