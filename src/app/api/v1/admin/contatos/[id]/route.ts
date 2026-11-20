import { exigirAdmin, idNumerico, ok, rota } from "@/server/http";
import { marcarRespondido } from "@/server/services/atendimento";

export const PATCH = rota<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await exigirAdmin(req);
  await marcarRespondido(idNumerico((await params).id), admin.id);
  return ok({ respondido: true });
});
