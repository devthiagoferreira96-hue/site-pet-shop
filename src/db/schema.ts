/** Esquema do banco (PostgreSQL) com Drizzle ORM. Gere migrações com: npm run db:generate */
import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const tipoVendaEnum = pgEnum("tipo_venda", ["livre", "receita", "controlado"]);
export const statusPedidoEnum = pgEnum("status_pedido", [
  "aguardando_pagamento", "pago", "separando", "pronto_retirada", "enviado", "entregue", "cancelado",
]);
export const tipoCredencialEnum = pgEnum("tipo_credencial", ["web", "access", "refresh"]);

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  nome: varchar("nome", { length: 120 }).notNull(),
  senhaHash: text("senha_hash").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  ultimoLogin: timestamp("ultimo_login", { withTimezone: true }),
});

/**
 * Credenciais de acesso (no banco vai SÓ o SHA-256 do token; o token nunca é salvo).
 *  web     -> cookie HttpOnly do painel no site (8 h)
 *  access  -> token curto do app (15 min), enviado em "Authorization: Bearer"
 *  refresh -> token longo do app (30 dias), trocado a cada uso (rotação). Se um refresh já usado
 *             aparecer de novo, é sinal de roubo: a família inteira é revogada.
 */
export const credenciais = pgTable("credenciais", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tipo: tipoCredencialEnum("tipo").notNull(),
  adminId: integer("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  familia: varchar("familia", { length: 64 }),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
  usadoEm: timestamp("usado_em", { withTimezone: true }),
  revogadoEm: timestamp("revogado_em", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("idx_cred_admin").on(t.adminId), index("idx_cred_familia").on(t.familia)]);

export const categorias = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 60 }).notNull().unique(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  emoji: varchar("emoji", { length: 8 }).notNull().default("🐾"),
  ordem: integer("ordem").notNull().default(0),
});

export const produtos = pgTable("produtos", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 60 }).unique(),          // mesmo código do SimplesVet
  nome: varchar("nome", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  categoriaId: integer("categoria_id").references(() => categorias.id),
  especie: varchar("especie", { length: 20 }).notNull().default("todos"),
  marca: varchar("marca", { length: 80 }),
  descricao: text("descricao").notNull().default(""),
  precoCentavos: integer("preco_centavos").notNull(),
  estoque: integer("estoque").notNull().default(0),
  tipoVenda: tipoVendaEnum("tipo_venda").notNull().default("livre"),
  registroMapa: varchar("registro_mapa", { length: 60 }),
  pesoVolume: varchar("peso_volume", { length: 40 }),
  imagem: varchar("imagem", { length: 80 }),
  imagemAlt: varchar("imagem_alt", { length: 200 }),
  imagemFonte: varchar("imagem_fonte", { length: 200 }),  // prova de origem/licença da imagem
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("idx_prod_cat").on(t.categoriaId), index("idx_prod_pub").on(t.ativo, t.tipoVenda)]);

export const pedidos = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  status: statusPedidoEnum("status").notNull().default("aguardando_pagamento"),
  canal: varchar("canal", { length: 10 }).notNull().default("site"),  // site | app
  nome: varchar("nome", { length: 120 }).notNull(),
  // CIFRADOS com AES-256-GCM (src/domain/cripto.ts). email_hash = índice cego para busca por e-mail.
  email: text("email").notNull(),
  emailHash: varchar("email_hash", { length: 64 }),
  telefone: text("telefone").notNull(),
  cpf: text("cpf"),                                                   // só entrega (NF-e) ou se o cliente quiser
  modalidade: varchar("modalidade", { length: 10 }).notNull(),
  endereco: text("endereco"),                                         // só entrega
  subtotalCentavos: integer("subtotal_centavos").notNull(),
  freteCentavos: integer("frete_centavos").notNull().default(0),
  totalCentavos: integer("total_centavos").notNull(),
  aceiteTermosVersao: varchar("aceite_termos_versao", { length: 20 }).notNull(),
  aceiteEm: timestamp("aceite_em", { withTimezone: true }).notNull(),
  marketingOptin: boolean("marketing_optin").notNull().default(false),
  marketingOptinEm: timestamp("marketing_optin_em", { withTimezone: true }),
  anonimizado: boolean("anonimizado").notNull().default(false),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("idx_ped_email_hash").on(t.emailHash), index("idx_ped_status").on(t.status)]);

export const pedidoItens = pgTable("pedido_itens", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id").notNull().references(() => pedidos.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id").references(() => produtos.id, { onDelete: "set null" }),
  nomeProduto: varchar("nome_produto", { length: 150 }).notNull(),
  sku: varchar("sku", { length: 60 }),
  precoUnitCentavos: integer("preco_unit_centavos").notNull(),
  quantidade: integer("quantidade").notNull(),
});

export const contatos = pgTable("contatos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 120 }).notNull(),
  email: text("email").notNull(),                                     // cifrado
  emailHash: varchar("email_hash", { length: 64 }),
  assunto: varchar("assunto", { length: 150 }).notNull(),
  mensagem: text("mensagem").notNull(),
  respondido: boolean("respondido").notNull().default(false),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("idx_contato_email_hash").on(t.emailHash)]);

export const solicitacoes = pgTable("solicitacoes", {
  id: serial("id").primaryKey(),
  protocolo: varchar("protocolo", { length: 20 }).notNull().unique(),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  nome: varchar("nome", { length: 120 }).notNull(),
  email: text("email").notNull(),                                     // cifrado
  emailHash: varchar("email_hash", { length: 64 }),
  codigoPedido: varchar("codigo_pedido", { length: 20 }),
  detalhes: text("detalhes"),
  status: varchar("status", { length: 20 }).notNull().default("aberta"),
  resposta: text("resposta"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  concluidoEm: timestamp("concluido_em", { withTimezone: true }),
}, (t) => [index("idx_sol_email_hash").on(t.emailHash)]);

export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  origem: varchar("origem", { length: 120 }).notNull(),
  atualizados: integer("atualizados").notNull().default(0),
  naoEncontrados: integer("nao_encontrados").notNull().default(0),
  erros: text("erros"),
  adminId: integer("admin_id").references(() => admins.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const auditoria = pgTable("auditoria", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id, { onDelete: "set null" }),
  acao: varchar("acao", { length: 60 }).notNull(),
  detalhe: varchar("detalhe", { length: 500 }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

