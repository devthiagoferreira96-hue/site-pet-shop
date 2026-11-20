import { lerJson, limitarPublico, ok, rota, verificarHumano } from "@/server/http";
import { contatoSchema } from "@/domain/validacao";
import { registrarContato } from "@/server/services/atendimento";

export const POST = rota(async (req) => {
  limitarPublico(req, "contato");
  const d = await lerJson(req, contatoSchema);
  await verificarHumano(req, d);
  await registrarContato(d);
  return ok({ mensagem: "Mensagem enviada. Responderemos pelo e-mail informado." }, 201);
});
