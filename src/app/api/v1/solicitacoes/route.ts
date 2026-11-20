import { lerJson, limitarPublico, ok, rota, verificarHumano } from "@/server/http";
import { solicitacaoSchema } from "@/domain/validacao";
import { registrarSolicitacao } from "@/server/services/atendimento";

/** Direitos do titular (LGPD, art. 18), desistência (CDC, art. 49) e trocas. */
export const POST = rota(async (req) => {
  limitarPublico(req, "solicitacao");
  const d = await lerJson(req, solicitacaoSchema);
  await verificarHumano(req, d);
  return ok(await registrarSolicitacao(d), 201);
});
