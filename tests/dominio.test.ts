/** Testes do núcleo de regras (rodam sem banco): npm run test:dominio */
import { test } from "node:test";
import assert from "node:assert/strict";
import { brl, parsePreco } from "../src/domain/dinheiro";
import { cpfValido, errosPorCampo, mascararCpf, pedidoSchema, solicitacaoSchema, contatoSchema, novaSenhaSchema } from "../src/domain/validacao";
import { calcularCotacao, produtoPublico, podeComprarOnline, visivelAoPublico, slugify, type ProdutoBase } from "../src/domain/regras";
import { hashSenha, verificarSenha, gerarToken, hashToken, HASH_FALSO, LimiteTentativas } from "../src/domain/seguranca";
import { interpretarLinhas, lerCsv, descontarReservados } from "../src/domain/planilha-estoque";

const prod = (o: Partial<ProdutoBase>): ProdutoBase => ({ id: 1, nome: "Ração", slug: "racao", precoCentavos: 5000, estoque: 3, tipoVenda: "livre", ativo: true, ...o });
const pedidoBase = { nome: "Maria Silva", email: "MARIA@exemplo.com ", telefone: "(11) 91234-5678", modalidade: "retirada", aceiteTermos: true, termosVersao: "1.0", itens: [{ produtoId: 1, quantidade: 1 }] };

test("dinheiro", () => {
  assert.equal(brl(123456).replace(/ /g, " "), "R$ 1.234,56");
  assert.equal(brl(5), "R$ 0,05");
  assert.equal(parsePreco("89,90"), 8990);
  assert.equal(parsePreco("1.234,56"), 123456);
  assert.equal(parsePreco("10.5"), 1050);
  assert.throws(() => parsePreco("abc"));
  assert.throws(() => parsePreco("-5"));
});

test("CPF", () => {
  assert.ok(cpfValido("529.982.247-25"));
  assert.ok(!cpfValido("111.111.111-11"));
  assert.ok(!cpfValido("529.982.247-24"));
  assert.equal(mascararCpf("52998224725"), "***.982.247-**");
});

test("pedido: minimização de dados e regras de entrega", () => {
  const ok = pedidoSchema.parse(pedidoBase);
  assert.equal(ok.email, "maria@exemplo.com");
  assert.equal(ok.telefone, "11912345678");
  assert.equal(ok.cpf, "");             // CPF opcional na retirada
  assert.equal(ok.endereco, "");
  assert.equal(ok.marketing, false);    // marketing desmarcado por padrão
  // endereço enviado na retirada é descartado (não guardamos o que não precisamos)
  assert.equal(pedidoSchema.parse({ ...pedidoBase, endereco: "Rua A, 10, Centro" }).endereco, "");
  // entrega exige CPF válido e endereço
  const r = pedidoSchema.safeParse({ ...pedidoBase, modalidade: "entrega", cpf: "123" });
  assert.ok(!r.success);
  const e = errosPorCampo(r.error!);
  assert.match(e.cpf, /nota fiscal/);
  assert.match(e.endereco, /endereço completo/);
  // sem aceite dos termos não passa
  const s = pedidoSchema.safeParse({ ...pedidoBase, aceiteTermos: false });
  assert.ok(!s.success && /Termos/.test(errosPorCampo(s.error).aceiteTermos));
  // a API ignora qualquer preço enviado pelo cliente
  const comPreco = pedidoSchema.parse({ ...pedidoBase, itens: [{ produtoId: 1, quantidade: 1, precoCentavos: 1 }] });
  assert.deepEqual(comPreco.itens[0], { produtoId: 1, quantidade: 1 });
});

test("solicitações e contato", () => {
  assert.ok(!solicitacaoSchema.safeParse({ tipo: "arrependimento", nome: "Jo", email: "jo@exemplo.com" }).success);
  assert.ok(solicitacaoSchema.safeParse({ tipo: "lgpd_acesso", nome: "Jo", email: "jo@exemplo.com" }).success);
  assert.ok(!contatoSchema.safeParse({ nome: "Jo", email: "x", assunto: "Oi", mensagem: "curta" }).success);
  assert.ok(!novaSenhaSchema.safeParse({ atual: "a", nova: "curta", confirma: "curta" }).success);
});

test("regras de medicamentos", () => {
  assert.ok(!visivelAoPublico(prod({ tipoVenda: "controlado" })));
  assert.ok(visivelAoPublico(prod({ tipoVenda: "receita" })));
  assert.ok(!podeComprarOnline(prod({ tipoVenda: "receita" })));
  assert.ok(!podeComprarOnline(prod({ estoque: 0 })));
  const pub = produtoPublico(prod({ tipoVenda: "receita", precoCentavos: 9990 }));
  assert.equal(pub.precoCentavos, null);           // receita: sem preço na API
  assert.equal(pub.vendaSomentePresencial, true);
});

test("cotação usa preço do banco e recusa itens proibidos", () => {
  const mapa = new Map<number, ProdutoBase>([
    [1, prod({ id: 1, precoCentavos: 5000, estoque: 3 })],
    [2, prod({ id: 2, tipoVenda: "receita" })],
    [3, prod({ id: 3, tipoVenda: "controlado" })],
    [4, prod({ id: 4, estoque: 0 })],
  ]);
  const c = calcularCotacao([{ produtoId: 1, quantidade: 2 }, { produtoId: 1, quantidade: 5 }, { produtoId: 2, quantidade: 1 },
    { produtoId: 3, quantidade: 1 }, { produtoId: 4, quantidade: 1 }, { produtoId: 99, quantidade: 1 }], mapa, 800);
  assert.equal(c.linhas.length, 1);
  assert.equal(c.linhas[0].quantidade, 3);         // somado (7) e limitado ao estoque (3)
  assert.equal(c.subtotalCentavos, 15000);
  assert.equal(c.totalCentavos, 15800);
  const motivos = c.recusados.map((r) => r.motivo).join(" | ");
  assert.match(motivos, /receita/);
  assert.match(motivos, /Sem estoque/);
  assert.match(motivos, /indisponível/);
  assert.equal(calcularCotacao([{ produtoId: 2, quantidade: 1 }], mapa, 800).freteCentavos, 0);
  assert.equal(slugify("Ração Gatos 10kg!"), "racao-gatos-10kg");
});

test("senha com scrypt", async () => {
  const h = await hashSenha("uma senha bem longa");
  assert.ok(h.startsWith("scrypt$") && !h.includes("uma senha"));
  assert.ok(await verificarSenha("uma senha bem longa", h));
  assert.ok(!(await verificarSenha("outra senha qualquer", h)));
  assert.ok(!(await verificarSenha("qualquer", HASH_FALSO)));
  assert.notEqual(await hashSenha("igual"), await hashSenha("igual")); // salt aleatório
});

test("tokens opacos", () => {
  const t = gerarToken();
  assert.match(t, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(t, gerarToken());
  assert.match(hashToken(t), /^[0-9a-f]{64}$/);
  const lim = new LimiteTentativas(2, 1000);
  lim.registrar("ip", 0); lim.registrar("ip", 10);
  assert.ok(lim.excedido("ip", 20));
  assert.ok(!lim.excedido("ip", 2000));
});

test("planilha do SimplesVet", () => {
  const linhas = lerCsv('Relatório de estoque\r\nCódigo;Descrição;Estoque atual\r\nA1;"Ração; 15kg";7\r\n123.0;Coleira;"1.234,5"\r\n;Sem código;3\r\n');
  const { itens, erros } = interpretarLinhas(linhas);
  assert.deepEqual(itens, [{ sku: "A1", estoque: 7 }, { sku: "123", estoque: 1234 }]);
  assert.equal(erros.length, 1);
  assert.throws(() => interpretarLinhas([["Nome", "Preço"], ["x", "1"]]), /colunas/);
  assert.deepEqual(descontarReservados([{ sku: "A1", estoque: 7 }], new Map([["A1", 2]])), [{ sku: "A1", estoque: 5 }]);
});

// ------------------------------------------------------------------ criptografia de dados pessoais
import { cifrar, decifrar, estaCifrado, indiceEmail, gerarChave } from "../src/domain/cripto";

test("criptografia AES-256-GCM dos dados pessoais", () => {
  process.env.DADOS_CHAVE = gerarChave();
  delete process.env.DADOS_CHAVE_ANTERIOR;
  const c = cifrar("529.982.247-25", "pedidos.cpf")!;
  assert.ok(estaCifrado(c) && !c.includes("529"));                    // não aparece em texto puro
  assert.notEqual(c, cifrar("529.982.247-25", "pedidos.cpf"));         // IV aleatório: mesmo valor, cifra diferente
  assert.equal(decifrar(c, "pedidos.cpf"), "529.982.247-25");
  assert.throws(() => decifrar(c, "pedidos.telefone"));                // copiado para outra coluna: não abre
  const adulterado = c.slice(0, -4) + (c.endsWith("AAAA") ? "BBBB" : "AAAA");
  assert.throws(() => decifrar(adulterado, "pedidos.cpf"));            // alterado no banco: detectado
  assert.equal(decifrar("texto antigo", "pedidos.cpf"), "texto antigo"); // registros anteriores à migração
  assert.equal(cifrar(null, "x"), null);
  // índice cego: mesmo e-mail (maiúsculas/espaços) = mesmo índice; não revela o e-mail
  assert.equal(indiceEmail(" Maria@Exemplo.com "), indiceEmail("maria@exemplo.com"));
  assert.match(indiceEmail("maria@exemplo.com")!, /^[0-9a-f]{64}$/);
  // troca de chave: o antigo continua legível com DADOS_CHAVE_ANTERIOR
  const antiga = process.env.DADOS_CHAVE;
  process.env.DADOS_CHAVE = gerarChave();
  assert.throws(() => decifrar(c, "pedidos.cpf"));
  process.env.DADOS_CHAVE_ANTERIOR = antiga;
  assert.equal(decifrar(c, "pedidos.cpf"), "529.982.247-25");
  delete process.env.DADOS_CHAVE_ANTERIOR;
  process.env.DADOS_CHAVE = "curta";
  assert.throws(() => cifrar("x", "y"), /32 bytes/);
});
