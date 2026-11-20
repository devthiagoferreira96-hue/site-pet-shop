import { exigirAdmin, ok, rota } from "@/server/http";
import { encerrarOutras } from "@/server/services/auth";

export const POST = rota(async (req) => {
  const n = await encerrarOutras(await exigirAdmin(req));
  return ok({ mensagem: `${n} sessão(ões) em outros dispositivos foram encerradas.` });
});
