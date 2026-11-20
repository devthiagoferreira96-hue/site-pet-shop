/**
 * Testes de integração dos serviços com um PostgreSQL de TESTE (nunca rode em produção: apaga dados).
 * Uso: crie um banco vazio, aponte DATABASE_URL para ele, rode `npm run db:migrate` e depois `npm run test:api`.
 */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { admins, categorias, credenciais, pedidos, produtos } from "@/db/schema";
import { CATEGORIAS_PADRAO } from "@/domain/regras";
import { hashSenha } from "@/domain/seguranca";
import { decifrar, estaCifrado, gerarChave, indiceEmail } from "@/domain/cripto";
import { pedidoSchema } from "@/domain/validacao";
import { POLITICAS } from "@/config/empresa";
import { listarPublico, obterPublico } from "@/server/services/produtos";
import { cotar, criarPedido, ErroEstoque, mudarStatus } from "@/server/services/pedidos";
import { emitirTokensApp, encerrarOutras, renovarTokensApp, sair, trocarSenha, validarCredencial, verificarLogin, criarSessaoWeb } from "@/server/services/auth";

process.env.DADOS_CHAVE ||= gerarChave(); // chave descartável só para o teste

if (!/test/i.test(process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL || "")) {
  console.error("Por segurança, o DATABASE_URL dos testes precisa conter 'test' no nome do banco.");
  process.exit(1);
}

let ids: Record<string, number> = {};
let adminId = 0;

before(async () => {
  await db.execute(sql`TRUNCATE credenciais, pedido_itens, pedidos, produtos, categorias, admins, auditoria, sync_logs RESTART IDENTITY CASCADE`);
  for (const c of CATEGORIAS_PADRAO) await db.insert(categorias).values(c);
  const [racoes] = await db.select().from(categorias).where(sql`slug = 'racoes'`);
  const [med] = await db.select().from(categorias).where(sql`slug = 'medicacoes'`);
  const ins = async (sku: string, tipoVenda: "livre" | "receita" | "controlado", estoque: number, cat = racoes.id) =>
    (await db.insert(produtos).values({ sku, nome: `Produto ${sku}`, slug: `p-${sku.toLowerCase()}`, categoriaId: cat, precoCentavos: 5000, estoque, tipoVenda, registroMapa: "X" })
      .returning({ id: produtos.id }))[0].id;
  ids = { livre: await ins("L1", "livre", 3), receita: await ins("R1", "receita", 5, med.id), controlado: await ins("C1", "controlado", 5, med.id) };
  [{ id: adminId }] = await db.insert(admins).values({ email: "adm@exemplo.com", nome: "Adm", senhaHash: await hashSenha("senha-muito-segura") }).returning({ id: admins.id });
});
// fecha a conexão com o banco no fim (process.exit aqui encerrava antes do último teste)
after(async () => { await db.$client.end(); });

const pedido = (extra: object = {}) => pedidoSchema.parse({
  nome: "Maria Silva", email: "maria@exemplo.com", telefone: "11912345678", modalidade: "retirada",
  aceiteTermos: true, termosVersao: POLITICAS.versao, itens: [{ produtoId: ids.livre, quantidade: 2 }], ...extra,
});

test("controlado nunca aparece; receita aparece sem preço", async () => {
  const lista = await listarPublico({});
  assert.ok(!lista.itens.some((p) => p.id === ids.controlado));
  assert.equal(await obterPublico("p-c1"), null);
  const r = lista.itens.find((p) => p.id === ids.receita)!;
  assert.equal(r.precoCentavos, null);
  assert.equal(r.disponivelOnline, false);
});

test("cotação recusa receita e controlado", async () => {
  const c = await cotar([{ produtoId: ids.receita, quantidade: 1 }, { produtoId: ids.controlado, quantidade: 1 }], "retirada");
  assert.equal(c.itens.length, 0);
  assert.equal(c.recusados.length, 2);
});

test("pedido baixa estoque, guarda o mínimo e não vende além do estoque", async () => {
  const p = await criarPedido(pedido(), "site");
  assert.match(p.codigo, /^MA-[0-9A-F]{8}$/);
  assert.equal(p.totalCentavos, 10000);
  const [linha] = await db.select().from(pedidos).where(sql`codigo = ${p.codigo}`);
  assert.equal(linha.cpf, null);
  assert.equal(linha.endereco, null);
  assert.equal(linha.marketingOptin, false);
  // dados pessoais gravados CIFRADOS; busca por e-mail só pelo índice cego
  assert.ok(estaCifrado(linha.email) && estaCifrado(linha.telefone));
  assert.ok(!linha.email.includes("maria") && !linha.telefone.includes("9123"));
  assert.equal(decifrar(linha.telefone, "pedidos.telefone"), "11912345678");
  assert.equal(linha.emailHash, indiceEmail("MARIA@exemplo.com"));
  const [prod] = await db.select().from(produtos).where(sql`id = ${ids.livre}`);
  assert.equal(prod.estoque, 1);
  await assert.rejects(criarPedido(pedido(), "app"), ErroEstoque); // pediu 2, só resta 1
  await assert.rejects(criarPedido(pedido({ itens: [{ produtoId: ids.receita, quantidade: 1 }] }), "site"), ErroEstoque);
  await mudarStatus(linha.id, "cancelado", adminId); // cancelar "aguardando pagamento" devolve ao estoque
  const [depois] = await db.select().from(produtos).where(sql`id = ${ids.livre}`);
  assert.equal(depois.estoque, 3);
});

test("login não revela se o e-mail existe e confere a senha", async () => {
  assert.equal(await verificarLogin("ninguem@exemplo.com", "x"), null);
  assert.equal(await verificarLogin("adm@exemplo.com", "errada"), null);
  assert.ok(await verificarLogin("ADM@exemplo.com", "senha-muito-segura"));
});

test("app: access curto, refresh rotativo e detecção de reuso", async () => {
  const t1 = await emitirTokensApp(adminId);
  assert.ok(await validarCredencial(t1.accessToken, "access"));
  assert.equal(await validarCredencial(t1.accessToken, "web"), null); // tipo errado não vale
  const t2 = await renovarTokensApp(t1.refreshToken);
  assert.ok(t2);
  assert.equal(await validarCredencial(t1.accessToken, "access"), null); // access antigo revogado
  assert.ok(await validarCredencial(t2!.accessToken, "access"));
  // reuso do refresh antigo (roubo): recusa e derruba a família inteira
  assert.equal(await renovarTokensApp(t1.refreshToken), null);
  assert.equal(await validarCredencial(t2!.accessToken, "access"), null);
  assert.equal(await renovarTokensApp(t2!.refreshToken), null);
  // o banco guarda só hashes
  const linhas = await db.select({ id: credenciais.id }).from(credenciais);
  assert.ok(linhas.every((l) => l.id !== t2!.refreshToken && /^[0-9a-f]{64}$/.test(l.id)));
});

test("logout revoga na hora; troca de senha derruba as outras sessões", async () => {
  const web = await criarSessaoWeb(adminId);
  const authWeb = (await validarCredencial(web, "web"))!;
  await sair(authWeb);
  assert.equal(await validarCredencial(web, "web"), null);

  const pc1 = await criarSessaoWeb(adminId), pc2 = await criarSessaoWeb(adminId);
  const app = await emitirTokensApp(adminId);
  const auth1 = (await validarCredencial(pc1, "web"))!;
  const r = await trocarSenha(auth1, "senha-muito-segura", "outra-senha-bem-longa");
  assert.ok(r.ok);
  assert.ok(await validarCredencial(pc1, "web"));            // quem trocou continua
  assert.equal(await validarCredencial(pc2, "web"), null);    // outro computador saiu
  assert.equal(await validarCredencial(app.accessToken, "access"), null);
  assert.equal(await renovarTokensApp(app.refreshToken), null);
  assert.equal(await encerrarOutras(auth1), 0);
});

/** O Drizzle embrulha o erro do PostgreSQL ("Failed query ..."); a mensagem real fica em cause. */
async function recusa(p: Promise<unknown>, re?: RegExp) {
  await assert.rejects(p, (e: Error & { cause?: Error }) => {
    const msg = `${e.cause?.message ?? ""} ${e.message}`;
    if (re && !re.test(msg)) throw new Error(`erro inesperado: ${e.cause?.message ?? e.message}`);
    return true;
  });
}

test("banco recusa adulteração de pedido e alteração de logs (se npm run db:seguranca foi aplicado)", async (t) => {
  const [trava] = await db.execute<{ existe: number }>(sql`select count(*)::int as existe from pg_trigger where tgname = 'ma_pedido_protegido'`);
  if (!trava?.existe) { t.skip("rode npm run db:seguranca no banco de teste para testar as travas"); return; }
  const p = await criarPedido(pedido({ itens: [{ produtoId: ids.livre, quantidade: 1 }] }), "site");
  await recusa(db.execute(sql`update pedidos set total_centavos = 1 where codigo = ${p.codigo}`), /não podem ser alterados/);
  await recusa(db.execute(sql`update pedidos set email = 'outro' where codigo = ${p.codigo}`), /anonimização/);
  await db.execute(sql`update pedidos set status = 'pago' where codigo = ${p.codigo}`); // status pode mudar
  await db.execute(sql`insert into auditoria (acao, detalhe) values ('teste', 'x')`);
  await recusa(db.execute(sql`update auditoria set detalhe = 'apagado' where acao = 'teste'`), /não podem ser alterados/);
  await recusa(db.execute(sql`delete from auditoria where acao = 'teste'`), /prazo de retenção/);
  await recusa(db.execute(sql`update produtos set preco_centavos = -1 where id = ${ids.livre}`), /preco_nao_negativo/);
});
