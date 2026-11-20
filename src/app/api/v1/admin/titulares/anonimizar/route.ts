import { z } from "zod";
import { exigirAdmin, lerJson, ok, rota } from "@/server/http";
import { emailSchema } from "@/domain/validacao";
import { anonimizarTitular } from "@/server/services/atendimento";

export const POST = rota(async (req) => {
  const admin = await exigirAdmin(req);
  const { email } = await lerJson(req, z.object({ email: emailSchema }));
  const r = await anonimizarTitular(email, admin.id);
  return ok({ ...r, mensagem: `${r.pedidos} pedido(s) anonimizado(s) e ${r.contatos} mensagem(ns) apagada(s). Pedidos em andamento não foram alterados.` });
});
