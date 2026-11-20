import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItens, pedidos, produtos } from "@/db/schema";
import { freteDe, POLITICAS } from "@/config/empresa";
import { calcularCotacao, STATUS_PEDIDO, type StatusPedido } from "@/domain/regras";
import { gerarCodigo } from "@/domain/seguranca";
import { cifrar, decifrar, indiceEmail } from "@/domain/cripto";
import type { pedidoSchema } from "@/domain/validacao";
import type { z } from "zod";
import { mapaParaCotacao, urlImagem } from "./produtos";
import { auditar } from "./auditoria";

type ItemPedido = { produtoId: number; quantidade: number };

/** Cotação do carrinho com preços do banco (site e app usam a mesma). */
export async function cotar(itens: ItemPedido[], modalidade: "retirada" | "entrega") {
  const mapa = await mapaParaCotacao([...new Set(itens.map((i) => i.produtoId))]);
  const c = calcularCotacao(itens, mapa, freteDe(modalidade));
  return {
    itens: c.linhas.map((l) => ({
      produtoId: l.produto.id, nome: l.produto.nome, slug: l.produto.slug, quantidade: l.quantidade,
      precoUnitCentavos: l.produto.precoCentavos, totalCentavos: l.totalCentavos,
      estoqueDisponivel: Math.min(l.produto.estoque, 20),
      imagemUrl: urlImagem(l.produto.imagem),
    })),
    recusados: c.recusados,
    subtotalCentavos: c.subtotalCentavos, freteCentavos: c.freteCentavos, totalCentavos: c.totalCentavos,
  };
}

export class ErroEstoque extends Error {}
export class ErroPedido extends Error {}

/**
 * Cria o pedido numa transação: revalida tudo, baixa o estoque só se houver saldo
 * (UPDATE ... WHERE estoque >= qtd) e grava o aceite dos termos com a versão.
 */
export async function criarPedido(dados: z.output<typeof pedidoSchema>, canal: "site" | "app") {
  if (dados.termosVersao !== POLITICAS.versao)
    throw new ErroPedido("Os Termos foram atualizados. Recarregue a página e confira antes de confirmar.");
  const cot = await cotar(dados.itens, dados.modalidade);
  if (cot.recusados.length || !cot.itens.length)
    throw new ErroEstoque(cot.recusados.map((r) => r.motivo).join(" ") || "Carrinho vazio.");

  const agora = new Date();
  return db.transaction(async (tx) => {
    for (const it of cot.itens) {
      const r = await tx.update(produtos).set({ estoque: sql`${produtos.estoque} - ${it.quantidade}` })
        .where(and(eq(produtos.id, it.produtoId), gte(produtos.estoque, it.quantidade), eq(produtos.tipoVenda, "livre"), eq(produtos.ativo, true)))
        .returning({ id: produtos.id });
      if (!r.length) throw new ErroEstoque(`O produto “${it.nome}” não tem mais estoque suficiente.`);
    }
    const skus = await tx.select({ id: produtos.id, sku: produtos.sku }).from(produtos).where(inArray(produtos.id, cot.itens.map((i) => i.produtoId)));
    const skuDe = new Map(skus.map((s) => [s.id, s.sku]));
    const [ped] = await tx.insert(pedidos).values({
      // dados pessoais sensíveis vão CIFRADOS para o banco
      codigo: gerarCodigo("MA"), canal, nome: dados.nome,
      email: cifrar(dados.email, "pedidos.email")!, emailHash: indiceEmail(dados.email),
      telefone: cifrar(dados.telefone, "pedidos.telefone")!,
      cpf: cifrar(dados.cpf || null, "pedidos.cpf"), modalidade: dados.modalidade, endereco: cifrar(dados.endereco || null, "pedidos.endereco"),
      subtotalCentavos: cot.subtotalCentavos, freteCentavos: cot.freteCentavos, totalCentavos: cot.totalCentavos,
      aceiteTermosVersao: dados.termosVersao, aceiteEm: agora,
      marketingOptin: dados.marketing, marketingOptinEm: dados.marketing ? agora : null,
    }).returning();
    await tx.insert(pedidoItens).values(cot.itens.map((it) => ({
      pedidoId: ped.id, produtoId: it.produtoId, nomeProduto: it.nome, sku: skuDe.get(it.produtoId) ?? null,
      precoUnitCentavos: it.precoUnitCentavos, quantidade: it.quantidade,
    })));
    // TODO (obrigatório – Decreto 7.962/2013, art. 4º, III): enviar e-mail de confirmação. Veja README.
    // Resposta com o mínimo necessário (sem CPF/endereço de volta).
    return {
      codigo: ped.codigo, status: ped.status, modalidade: ped.modalidade, email: dados.email,
      itens: cot.itens.map(({ nome, quantidade, precoUnitCentavos, totalCentavos }) => ({ nome, quantidade, precoUnitCentavos, totalCentavos })),
      subtotalCentavos: ped.subtotalCentavos, freteCentavos: ped.freteCentavos, totalCentavos: ped.totalCentavos,
      criadoEm: ped.criadoEm,
    };
  });
}

// ------------------------------------------------------------------ admin

export async function listarPedidos(status?: string) {
  const filtro = status && status in STATUS_PEDIDO ? eq(pedidos.status, status as StatusPedido) : undefined;
  return db.select({
    id: pedidos.id, codigo: pedidos.codigo, status: pedidos.status, canal: pedidos.canal, nome: pedidos.nome,
    modalidade: pedidos.modalidade, totalCentavos: pedidos.totalCentavos, criadoEm: pedidos.criadoEm,
  }).from(pedidos).where(filtro).orderBy(desc(pedidos.id)).limit(200);
}

export async function obterPedido(id: number) {
  const [ped] = await db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1);
  if (!ped) return null;
  const itens = await db.select().from(pedidoItens).where(eq(pedidoItens.pedidoId, id));
  // decifra só aqui (tela do admin); o índice cego não sai do servidor
  const { emailHash: _h, ...resto } = ped;
  return {
    ...resto, itens,
    email: decifrar(ped.email, "pedidos.email") ?? "", telefone: decifrar(ped.telefone, "pedidos.telefone") ?? "",
    cpf: decifrar(ped.cpf, "pedidos.cpf"), endereco: decifrar(ped.endereco, "pedidos.endereco"),
  };
}

export async function mudarStatus(id: number, novo: StatusPedido, adminId: number) {
  return db.transaction(async (tx) => {
    const [ped] = await tx.select().from(pedidos).where(eq(pedidos.id, id)).limit(1);
    if (!ped) return null;
    if (novo === "cancelado" && ped.status === "aguardando_pagamento") {
      // devolve ao estoque do site o que ainda não foi lançado no SimplesVet
      const itens = await tx.select().from(pedidoItens).where(eq(pedidoItens.pedidoId, id));
      for (const it of itens) if (it.produtoId)
        await tx.update(produtos).set({ estoque: sql`${produtos.estoque} + ${it.quantidade}` }).where(eq(produtos.id, it.produtoId));
    }
    await tx.update(pedidos).set({ status: novo }).where(eq(pedidos.id, id));
    await auditar(adminId, "pedido_status", `${ped.codigo} ${ped.status} -> ${novo}`);
    return { codigo: ped.codigo, de: ped.status, para: novo };
  });
}

/** SKU -> quantidade reservada em pedidos aguardando pagamento (ainda não lançados no SimplesVet). */
export async function reservadosPorSku() {
  const linhas = await db.select({ sku: pedidoItens.sku, qtd: sql<number>`sum(${pedidoItens.quantidade})::int` })
    .from(pedidoItens).innerJoin(pedidos, eq(pedidos.id, pedidoItens.pedidoId))
    .where(eq(pedidos.status, "aguardando_pagamento")).groupBy(pedidoItens.sku);
  return new Map<string, number>(linhas.filter((l: { sku: string | null }) => l.sku).map((l: { sku: string | null; qtd: number }) => [l.sku as string, Number(l.qtd)] as const));
}
