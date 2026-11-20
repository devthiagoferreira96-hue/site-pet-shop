import { exigirAdmin, ok, rota } from "@/server/http";

export const GET = rota(async (req) => {
  const a = await exigirAdmin(req);
  return ok({ nome: a.nome, email: a.email });
});
