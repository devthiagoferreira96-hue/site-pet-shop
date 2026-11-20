/** Fale conosco, solicitações de titulares (LGPD) e de arrependimento (CDC), e retenção de dados. */
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditoria, contatos, pedidos, solicitacoes } from "@/db/schema";
import { RETENCAO } from "@/config/empresa";
import { gerarCodigo } from "@/domain/seguranca";
import { cifrar, decifrar, indiceEmail } from "@/domain/cripto";
import type { contatoSchema, solicitacaoSchema } from "@/domain/validacao";
import type { z } from "zod";
import { auditar } from "./auditoria";
import { limparCredenciaisVencidas } from "./auth";

export async function registrarContato(d: z.output<typeof contatoSchema>) {
  if (d.site) return; // robô preencheu o campo-armadilha: finge sucesso e descarta
  await db.insert(contatos).values({ nome: d.nome, email: cifrar(d.email, "contatos.email")!, emailHash: indiceEmail(d.email), assunto: d.assunto, mensagem: d.mensagem });
}

export async function registrarSolicitacao(d: z.output<typeof solicitacaoSchema>) {
  const protocolo = gerarCodigo("SOL");
  await db.insert(solicitacoes).values({
    protocolo, tipo: d.tipo, nome: d.nome, email: cifrar(d.email, "solicitacoes.email")!, emailHash: indiceEmail(d.email),
    codigoPedido: d.codigoPedido || null, detalhes: d.detalhes || null,
  });
  return { protocolo, prazo: d.tipo.startsWith("lgpd_") ? "até 15 dias (LGPD, art. 19)" : "até 5 dias úteis" };
}

export async function listarContatos() {
  const lista = await db.select().from(contatos).orderBy(contatos.respondido, desc(contatos.id)).limit(300);
  return lista.map(({ emailHash: _h, ...c }) => ({ ...c, email: decifrar(c.email, "contatos.email") ?? "" }));
}
export async function marcarRespondido(id: number, adminId: number) {
  await db.update(contatos).set({ respondido: true }).where(eq(contatos.id, id));
  await auditar(adminId, "contato_respondido", String(id));
}

/** Lista enxuta: a lista não mostra e-mail nem detalhes (só a tela de cada solicitação). */
export const listarSolicitacoes = () =>
  db.select({ id: solicitacoes.id, protocolo: solicitacoes.protocolo, tipo: solicitacoes.tipo, nome: solicitacoes.nome,
    status: solicitacoes.status, criadoEm: solicitacoes.criadoEm })
    .from(solicitacoes).orderBy(sql`${solicitacoes.status} = 'concluida'`, desc(solicitacoes.id)).limit(300);

export async function obterSolicitacao(id: number) {
  const [linha] = await db.select().from(solicitacoes).where(eq(solicitacoes.id, id)).limit(1);
  if (!linha) return null;
  const { emailHash, ...s } = linha;
  const pedidosTitular = emailHash
    ? await db.select({ codigo: pedidos.codigo, status: pedidos.status, criadoEm: pedidos.criadoEm, anonimizado: pedidos.anonimizado })
        .from(pedidos).where(eq(pedidos.emailHash, emailHash)).orderBy(desc(pedidos.id))
    : [];
  return { ...s, email: decifrar(s.email, "solicitacoes.email") ?? "", pedidosTitular };
}

export async function atualizarSolicitacao(id: number, status: "aberta" | "em_andamento" | "concluida", resposta: string, adminId: number) {
  const [s] = await db.update(solicitacoes)
    .set({ status, resposta: resposta.slice(0, 3000), concluidoEm: status === "concluida" ? new Date() : null })
    .where(eq(solicitacoes.id, id)).returning({ protocolo: solicitacoes.protocolo });
  if (s) await auditar(adminId, "solicitacao_atualizada", `${s.protocolo} -> ${status}`);
  return s ?? null;
}

/**
 * Pedido de eliminação: anonimiza pedidos concluídos e apaga mensagens do e-mail.
 * Pedidos com nota fiscal mantêm valores/itens e o CPF pelo prazo fiscal (LGPD, art. 16, I).
 */
export async function anonimizarTitular(email: string, adminId: number) {
  const hash = indiceEmail(email);
  if (!hash) return { pedidos: 0, contatos: 0 };
  const ped = await db.update(pedidos).set({
    nome: "Titular anonimizado", email: "anonimizado", emailHash: null, telefone: "anonimizado",
    endereco: null, marketingOptin: false, anonimizado: true,
  }).where(and(eq(pedidos.emailHash, hash), inArray(pedidos.status, ["entregue", "cancelado"]))).returning({ id: pedidos.id });
  const cont = await db.delete(contatos).where(eq(contatos.emailHash, hash)).returning({ id: contatos.id });
  await auditar(adminId, "titular_anonimizado", `pedidos=${ped.length} contatos=${cont.length}`);
  return { pedidos: ped.length, contatos: cont.length };
}

/** Política de retenção (LGPD, arts. 15 e 16). Agende 1x por dia: npm run limpar-dados */
export async function aplicarRetencao() {
  const agora = Date.now();
  const cont = await db.delete(contatos).where(lte(contatos.criadoEm, new Date(agora - RETENCAO.contatoDias * 864e5))).returning({ id: contatos.id });
  const ped = await db.update(pedidos).set({
    nome: "Titular anonimizado", email: "anonimizado", emailHash: null, telefone: "anonimizado",
    cpf: null, endereco: null, marketingOptin: false, anonimizado: true,
  }).where(and(eq(pedidos.anonimizado, false), lte(pedidos.criadoEm, new Date(agora - RETENCAO.pedidosAnos * 365.25 * 864e5)))).returning({ id: pedidos.id });
  const sol = await db.delete(solicitacoes).where(and(eq(solicitacoes.status, "concluida"), lte(solicitacoes.concluidoEm, new Date(agora - 5 * 365.25 * 864e5)))).returning({ id: solicitacoes.id });
  const aud = await db.delete(auditoria).where(lte(auditoria.criadoEm, new Date(agora - 2 * 365.25 * 864e5))).returning({ id: auditoria.id });
  const cred = await limparCredenciaisVencidas();
  return { contatos: cont.length, pedidosAnonimizados: ped.length, solicitacoes: sol.length, auditoria: aud.length, credenciais: cred };
}
