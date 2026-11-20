import { exigirAdmin, ok, rota } from "@/server/http";
import { listarSolicitacoes } from "@/server/services/atendimento";

export const GET = rota(async (req) => {
  await exigirAdmin(req);
  return ok(await listarSolicitacoes());
});
