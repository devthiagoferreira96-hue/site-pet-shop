import { z } from "zod";
import { erro, exigirAdmin, idNumerico, lerJson, ok, rota } from "@/server/http";
import { atualizarSolicitacao, obterSolicitacao } from "@/server/services/atendimento";

type Ctx = { params: Promise<{ id: string }> };

export const GET = rota<Ctx>(async (req, { params }) => {
  await exigirAdmin(req);
  const s = await obterSolicitacao(idNumerico((await params).id));
  return s ? ok(s) : erro(404, "Solicitação não encontrada.");
});

export const PATCH = rota<Ctx>(async (req, { params }) => {
  const admin = await exigirAdmin(req);
  const d = await lerJson(req, z.object({ status: z.enum(["aberta", "em_andamento", "concluida"]), resposta: z.string().max(3000).default("") }));
  const r = await atualizarSolicitacao(idNumerico((await params).id), d.status, d.resposta, admin.id);
  return r ? ok(r) : erro(404, "Solicitação não encontrada.");
});
