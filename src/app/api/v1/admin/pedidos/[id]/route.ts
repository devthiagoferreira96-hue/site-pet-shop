import { z } from "zod";
import { erro, exigirAdmin, idNumerico, lerJson, ok, rota } from "@/server/http";
import { STATUS_PEDIDO, type StatusPedido } from "@/domain/regras";
import { mudarStatus, obterPedido } from "@/server/services/pedidos";
import { auditar } from "@/server/services/auditoria";
import { mascararCpf } from "@/domain/validacao";

type Ctx = { params: Promise<{ id: string }> };

export const GET = rota<Ctx>(async (req, { params }) => {
  const admin = await exigirAdmin(req);
  const p = await obterPedido(idNumerico((await params).id));
  if (!p) return erro(404, "Pedido não encontrado.");
  await auditar(admin.id, "pedido_visualizado", p.codigo);
  // CPF mascarado na tela; o completo só é usado na emissão da nota (no sistema fiscal)
  return ok({ ...p, cpf: mascararCpf(p.cpf) || null });
});

export const PATCH = rota<Ctx>(async (req, { params }) => {
  const admin = await exigirAdmin(req);
  const { status } = await lerJson(req, z.object({ status: z.enum(Object.keys(STATUS_PEDIDO) as [StatusPedido]) }));
  const r = await mudarStatus(idNumerico((await params).id), status, admin.id);
  if (!r) return erro(404, "Pedido não encontrado.");
  return ok({ ...r, lembrete: status === "pago" ? "Lance esta venda no SimplesVet para manter o estoque igual nos dois sistemas." : null });
});
