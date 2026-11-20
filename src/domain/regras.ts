/**
 * Regras de negócio de medicamentos e de venda — valem para o site E para o app,
 * porque são aplicadas no servidor (nunca confie só no front-end).
 *
 *  livre      -> vendido online
 *  receita    -> aparece SEM preço e SEM compra: venda só na loja física, com receita
 *  controlado -> sujeito à Portaria MAPA 837/2025: NUNCA aparece no site/app
 */
export type TipoVenda = "livre" | "receita" | "controlado";

export const TIPOS_VENDA: Record<TipoVenda, string> = {
  livre: "Venda livre (online)",
  receita: "Exige receita — venda somente na loja física",
  controlado: "Controle especial (Portaria MAPA 837/2025) — não exibir",
};

export const MAX_QTD_ITEM = 20;

export interface ProdutoBase {
  id: number;
  nome: string;
  slug: string;
  precoCentavos: number;
  estoque: number;
  tipoVenda: TipoVenda;
  ativo: boolean;
  registroMapa?: string | null;
  categoriaSlug?: string | null;
}

export const visivelAoPublico = (p: Pick<ProdutoBase, "ativo" | "tipoVenda">) => p.ativo && p.tipoVenda !== "controlado";

export const podeComprarOnline = (p: Pick<ProdutoBase, "ativo" | "tipoVenda" | "estoque">) =>
  p.ativo && p.tipoVenda === "livre" && p.estoque > 0;

/** Representação pública do produto (o que a API devolve). Remove o preço dos itens com receita. */
export function produtoPublico<T extends ProdutoBase>(p: T) {
  const receita = p.tipoVenda === "receita";
  return {
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    tipoVenda: p.tipoVenda as Exclude<TipoVenda, "controlado">,
    precoCentavos: receita ? null : p.precoCentavos,
    disponivelOnline: podeComprarOnline(p),
    estoqueDisponivel: receita ? null : Math.min(p.estoque, MAX_QTD_ITEM),
    vendaSomentePresencial: receita,
  };
}

export const CATEGORIAS_PADRAO = [
  { nome: "Rações", slug: "racoes", emoji: "🍖", ordem: 1 },
  { nome: "Acessórios", slug: "acessorios", emoji: "🎾", ordem: 2 },
  { nome: "Medicações", slug: "medicacoes", emoji: "💊", ordem: 3 },
] as const;

export const CATEGORIA_MEDICAMENTOS = "medicacoes";

export const STATUS_PEDIDO = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pagamento confirmado",
  separando: "Em separação",
  pronto_retirada: "Pronto para retirada",
  enviado: "Saiu para entrega",
  entregue: "Entregue / retirado",
  cancelado: "Cancelado",
} as const;
export type StatusPedido = keyof typeof STATUS_PEDIDO;

export interface LinhaCotacao<P extends ProdutoBase = ProdutoBase> { produto: P; quantidade: number; totalCentavos: number }

/**
 * Calcula a cotação com preços do BANCO. Itens inválidos (receita, controlado, sem estoque, inativos)
 * são recusados com motivo — o cliente não consegue comprar o que não pode.
 */
export function calcularCotacao<P extends ProdutoBase>(
  pedidos: { produtoId: number; quantidade: number }[],
  produtos: Map<number, P>,
  freteCentavos: number,
) {
  const linhas: LinhaCotacao<P>[] = [];
  const recusados: { produtoId: number; motivo: string }[] = [];
  const somados = new Map<number, number>();
  for (const { produtoId, quantidade } of pedidos) somados.set(produtoId, (somados.get(produtoId) ?? 0) + quantidade);

  for (const [produtoId, qtdPedida] of somados) {
    const p = produtos.get(produtoId);
    if (!p || !visivelAoPublico(p)) { recusados.push({ produtoId, motivo: "Produto indisponível." }); continue; }
    if (p.tipoVenda === "receita") { recusados.push({ produtoId, motivo: "Exige receita: venda somente na loja física." }); continue; }
    if (p.estoque <= 0) { recusados.push({ produtoId, motivo: "Sem estoque." }); continue; }
    const quantidade = Math.min(qtdPedida, p.estoque, MAX_QTD_ITEM);
    if (quantidade < qtdPedida) recusados.push({ produtoId, motivo: `Quantidade ajustada para ${quantidade} (estoque disponível).` });
    linhas.push({ produto: p, quantidade, totalCentavos: p.precoCentavos * quantidade });
  }
  const subtotal = linhas.reduce((s, l) => s + l.totalCentavos, 0);
  const frete = linhas.length ? freteCentavos : 0;
  return { linhas, recusados, subtotalCentavos: subtotal, freteCentavos: frete, totalCentavos: subtotal + frete };
}

export function slugify(texto: string): string {
  const s = texto.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return s || Math.random().toString(16).slice(2, 10);
}
