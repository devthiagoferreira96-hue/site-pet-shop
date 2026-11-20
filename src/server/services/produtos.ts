import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categorias, produtos } from "@/db/schema";
import { CATEGORIA_MEDICAMENTOS, produtoPublico, slugify, type ProdutoBase, type TipoVenda } from "@/domain/regras";
import { parsePreco } from "@/domain/dinheiro";
import { auditar } from "./auditoria";
import { fotoLocal } from "../fotos";

export const POR_PAGINA = 12;
export const ESPECIES = { cachorro: "Cachorro", gato: "Gato", passaro: "Pássaro", peixe: "Peixe", roedor: "Roedores", todos: "Todos os pets" } as const;

const colunasPublicas = {
  id: produtos.id, nome: produtos.nome, slug: produtos.slug, precoCentavos: produtos.precoCentavos, estoque: produtos.estoque,
  tipoVenda: produtos.tipoVenda, ativo: produtos.ativo, marca: produtos.marca, descricao: produtos.descricao,
  especie: produtos.especie, pesoVolume: produtos.pesoVolume, registroMapa: produtos.registroMapa, sku: produtos.sku,
  imagem: produtos.imagem, imagemAlt: produtos.imagemAlt, categoriaNome: categorias.nome, categoriaSlug: categorias.slug,
};
type LinhaProduto = ProdutoBase & {
  marca: string | null; descricao: string; especie: string; pesoVolume: string | null; registroMapa: string | null;
  sku: string | null; imagem: string | null; imagemAlt: string | null; categoriaNome: string | null; categoriaSlug: string | null;
};

export const urlImagem = (arquivo: string | null) => (arquivo ? `/api/v1/imagens/${arquivo}` : null);

/** Formato que a API pública (site e app) devolve. Controlados nunca chegam aqui. */
export function serializarPublico(p: LinhaProduto, completo = false) {
  return {
    ...produtoPublico(p),
    marca: p.marca,
    categoria: p.categoriaSlug ? { slug: p.categoriaSlug, nome: p.categoriaNome } : null,
    // Foto enviada no painel; se não houver, usa a foto de public/img/produtos/<slug>.* (se existir)
    imagem: p.imagem ? { url: urlImagem(p.imagem), alt: p.imagemAlt ?? "" } : (() => { const u = fotoLocal("produtos", p.slug); return u ? { url: u, alt: "" } : null; })(),
    ...(completo ? {
      descricao: p.descricao, especie: p.especie, pesoVolume: p.pesoVolume, registroMapa: p.registroMapa, sku: p.sku,
      usoVeterinario: p.categoriaSlug === CATEGORIA_MEDICAMENTOS,
    } : {}),
  };
}

const filtroPublico = and(eq(produtos.ativo, true), ne(produtos.tipoVenda, "controlado"));

export async function listarCategorias() {
  return db.select({ nome: categorias.nome, slug: categorias.slug, emoji: categorias.emoji }).from(categorias).orderBy(asc(categorias.ordem));
}

export async function listarPublico(opts: { categoria?: string; especie?: "cachorro" | "gato"; q?: string; pagina?: number; ordem?: "nome" | "recentes"; limite?: number }) {
  const conds: (SQL | undefined)[] = [filtroPublico];
  if (opts.categoria) conds.push(eq(categorias.slug, opts.categoria));
  if (opts.especie) conds.push(inArray(produtos.especie, [opts.especie, "todos"]));
  const q = (opts.q ?? "").trim().slice(0, 80);
  if (q) {
    const termo = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(produtos.nome, termo), ilike(produtos.marca, termo), ilike(produtos.descricao, termo)));
  }
  const where = and(...conds);
  const limite = Math.min(opts.limite ?? POR_PAGINA, 50);
  const pagina = Math.max(1, Math.floor(opts.pagina ?? 1));
  const [{ total }] = await db.select({ total: count() }).from(produtos).leftJoin(categorias, eq(categorias.id, produtos.categoriaId)).where(where);
  const linhas = await db.select(colunasPublicas).from(produtos).leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(where).orderBy(opts.ordem === "recentes" ? desc(produtos.criadoEm) : asc(produtos.nome))
    .limit(limite).offset((pagina - 1) * limite);
  return { itens: linhas.map((l) => serializarPublico(l as LinhaProduto)), total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) };
}

export async function obterPublico(slug: string) {
  const [p] = await db.select(colunasPublicas).from(produtos).leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(and(eq(produtos.slug, slug), filtroPublico)).limit(1);
  return p ? serializarPublico(p as LinhaProduto, true) : null;
}

export type ProdutoInterno = ProdutoBase & { sku: string | null; imagem: string | null };

/** Produtos com dados internos (estoque real, tipo) para cotação/pedido. */
export async function mapaParaCotacao(ids: number[]) {
  if (!ids.length) return new Map<number, ProdutoInterno>();
  const linhas = await db.select({
    id: produtos.id, nome: produtos.nome, slug: produtos.slug, precoCentavos: produtos.precoCentavos, estoque: produtos.estoque,
    tipoVenda: produtos.tipoVenda, ativo: produtos.ativo, sku: produtos.sku, imagem: produtos.imagem,
  }).from(produtos).where(inArray(produtos.id, ids));
  return new Map<number, ProdutoInterno>(linhas.map((l: ProdutoInterno) => [l.id, l] as const));
}

// ------------------------------------------------------------------ admin

export const produtoAdminSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome do produto.").max(150),
  sku: z.string().trim().max(60).optional().transform((s) => s || null),
  categoriaId: z.coerce.number().int().positive({ message: "Escolha uma categoria." }),
  especie: z.enum(Object.keys(ESPECIES) as [keyof typeof ESPECIES]).default("todos"),
  marca: z.string().trim().max(80).optional().transform((s) => s || null),
  descricao: z.string().trim().max(5000).default(""),
  preco: z.string().transform((s, ctx) => {
    try { return parsePreco(s); } catch { ctx.addIssue({ code: "custom", message: "Preço inválido. Use o formato 89,90." }); return z.NEVER; }
  }),
  estoque: z.coerce.number().int().min(0, "Estoque não pode ser negativo.").default(0),
  tipoVenda: z.enum(["livre", "receita", "controlado"]).default("livre"),
  registroMapa: z.string().trim().max(60).optional().transform((s) => s || null),
  pesoVolume: z.string().trim().max(40).optional().transform((s) => s || null),
  imagemAlt: z.string().trim().max(200).optional().transform((s) => s || null),
  ativo: z.boolean().default(true),
});
export type ProdutoAdminEntrada = z.infer<typeof produtoAdminSchema>;

export async function listarAdmin(q = "") {
  const termo = `%${q.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return db.select({ ...colunasPublicas, categoriaId: produtos.categoriaId, imagemFonte: produtos.imagemFonte })
    .from(produtos).leftJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(q.trim() ? or(ilike(produtos.nome, termo), ilike(produtos.sku, termo)) : undefined)
    .orderBy(desc(produtos.ativo), asc(produtos.nome));
}

export async function obterAdmin(id: number) {
  const [p] = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return p ?? null;
}

/** Valida regras que dependem do banco. Retorna erros por campo (ou {}). */
async function validarRegras(d: ProdutoAdminEntrada, id: number | null, temImagem: boolean) {
  const erros: Record<string, string> = {};
  const [cat] = await db.select().from(categorias).where(eq(categorias.id, d.categoriaId)).limit(1);
  if (!cat) erros.categoriaId = "Escolha uma categoria.";
  else if (cat.slug === CATEGORIA_MEDICAMENTOS && !d.registroMapa)
    erros.registroMapa = "Medicamentos precisam do nº de registro/licença no MAPA (veja a embalagem).";
  if (d.sku) {
    const [dup] = await db.select({ id: produtos.id }).from(produtos).where(and(eq(produtos.sku, d.sku), ne(produtos.id, id ?? 0))).limit(1);
    if (dup) erros.sku = "Já existe outro produto com este código.";
  }
  if (temImagem && !d.imagemAlt) erros.imagemAlt = "Descreva a imagem (texto alternativo) para pessoas com deficiência visual.";
  return erros;
}

export async function salvarProduto(d: ProdutoAdminEntrada, id: number | null, adminId: number) {
  const atual = id ? await obterAdmin(id) : null;
  if (id && !atual) return { erros: { _: "Produto não encontrado." } };
  const erros = await validarRegras(d, id, Boolean(atual?.imagem));
  if (Object.keys(erros).length) return { erros };
  const valores = {
    nome: d.nome, sku: d.sku, categoriaId: d.categoriaId, especie: d.especie, marca: d.marca, descricao: d.descricao,
    precoCentavos: d.preco, estoque: d.estoque, tipoVenda: d.tipoVenda as TipoVenda, registroMapa: d.registroMapa,
    pesoVolume: d.pesoVolume, imagemAlt: d.imagemAlt, ativo: d.ativo,
  };
  if (atual) {
    await db.update(produtos).set({ ...valores, atualizadoEm: new Date() }).where(eq(produtos.id, atual.id));
    await auditar(adminId, "produto_editado", `${atual.id} ${d.nome}`);
    return { id: atual.id };
  }
  let slug = slugify(d.nome);
  const [existe] = await db.select({ id: produtos.id }).from(produtos).where(eq(produtos.slug, slug)).limit(1);
  if (existe) slug = `${slug}-${Math.random().toString(16).slice(2, 6)}`;
  const [novo] = await db.insert(produtos).values({ ...valores, slug }).returning({ id: produtos.id });
  await auditar(adminId, "produto_criado", `${novo.id} ${d.nome}`);
  return { id: novo.id };
}

export async function definirImagem(id: number, arquivo: string, alt: string, fonte: string, adminId: number) {
  await db.update(produtos).set({ imagem: arquivo, imagemAlt: alt, imagemFonte: fonte, atualizadoEm: new Date() }).where(eq(produtos.id, id));
  await auditar(adminId, "produto_imagem", `${id} fonte: ${fonte}`);
}

export async function resumoPainel() {
  const [r] = await db.execute<{ produtos: number; sem_estoque: number; pedidos_pendentes: number; solicitacoes: number; antigas: number; contatos: number; sem_alt: number; med_sem_registro: number }>(sql`
    SELECT
      (SELECT count(*) FROM produtos WHERE ativo)::int AS produtos,
      (SELECT count(*) FROM produtos WHERE ativo AND estoque = 0 AND tipo_venda = 'livre')::int AS sem_estoque,
      (SELECT count(*) FROM pedidos WHERE status IN ('aguardando_pagamento','pago','separando'))::int AS pedidos_pendentes,
      (SELECT count(*) FROM solicitacoes WHERE status <> 'concluida')::int AS solicitacoes,
      (SELECT count(*) FROM solicitacoes WHERE status <> 'concluida' AND criado_em <= now() - interval '10 days')::int AS antigas,
      (SELECT count(*) FROM contatos WHERE NOT respondido)::int AS contatos,
      (SELECT count(*) FROM produtos WHERE imagem IS NOT NULL AND coalesce(imagem_alt,'') = '')::int AS sem_alt,
      (SELECT count(*) FROM produtos p JOIN categorias c ON c.id = p.categoria_id
         WHERE c.slug = ${CATEGORIA_MEDICAMENTOS} AND coalesce(p.registro_mapa,'') = '')::int AS med_sem_registro`);
  return r;
}
