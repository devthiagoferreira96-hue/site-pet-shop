import { exigirAdmin, ok, rota } from "@/server/http";
import { listarPedidos } from "@/server/services/pedidos";

export const GET = rota(async (req) => {
  await exigirAdmin(req);
  return ok(await listarPedidos(req.nextUrl.searchParams.get("status") ?? undefined));
});
