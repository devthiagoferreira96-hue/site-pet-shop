/**
 * Produtos FICTÍCIOS só para testar o carrossel da home (18 por categoria; somados aos 3 que já existem, dá 21 por fileira).
 *
 *   npm run db:seed-carrossel              -> cria os produtos de teste (pode rodar mais de uma vez; não duplica)
 *   npm run dev                            -> também roda sozinho ao subir o site, SÓ se o banco for local (localhost/127.0.0.1/db).
 *                                             Para desligar: coloque SEED_TESTE_CARROSSEL=0 no .env
 *   npm run db:seed-carrossel -- --remover -> apaga todos os produtos de teste (SKU começando com "TESTE-")
 *
 * Os nomes são genéricos (sem marcas reais) e os registros no MAPA são marcados como TESTE — não são registros reais.
 * Antes de publicar a loja, rode com --remover.
 */
import { like, eq } from "drizzle-orm";
import { db } from "../src/db";
import { categorias, produtos } from "../src/db/schema";
import { slugify } from "../src/domain/regras";

type Item = { nome: string; preco: number; estoque: number; especie?: string; marca?: string; peso?: string; receita?: boolean };

const ITENS: Record<string, { prefixo: string; itens: Item[] }> = {
  acessorios: { prefixo: "TESTE-ACE", itens: [
    { nome: "Bolinha de Borracha Mordedor", preco: 1490, estoque: 40, especie: "cachorro" },
    { nome: "Comedouro Inox Antiderrapante M", preco: 3990, estoque: 25, especie: "todos", peso: "700 ml" },
    { nome: "Bebedouro Fonte para Gatos", preco: 14990, estoque: 8, especie: "gato" },
    { nome: "Guia Retrátil 5 metros", preco: 5990, estoque: 18, especie: "cachorro" },
    { nome: "Peitoral Ajustável Vermelho", preco: 6490, estoque: 15, especie: "cachorro" },
    { nome: "Brinquedo de Corda com Nós", preco: 1990, estoque: 30, especie: "cachorro" },
    { nome: "Caixa de Transporte Média", preco: 18990, estoque: 6, especie: "todos" },
    { nome: "Escova Removedora de Pelos", preco: 2990, estoque: 22, especie: "todos" },
    { nome: "Tapete Higiênico Pacote 30un", preco: 7490, estoque: 0, especie: "cachorro" },
    { nome: "Cama Redonda de Pelúcia P", preco: 8990, estoque: 10, especie: "todos" },
    { nome: "Coleira com Plaquinha de Identificação", preco: 3490, estoque: 26, especie: "cachorro" },
    { nome: "Arranhador de Papelão Curvo", preco: 4990, estoque: 14, especie: "gato" },
    { nome: "Roupinha Moletom Cães P", preco: 5990, estoque: 12, especie: "cachorro" },
    { nome: "Varinha de Brincar com Penas", preco: 1790, estoque: 33, especie: "gato" },
    { nome: "Cortador de Unhas Pet", preco: 2490, estoque: 19, especie: "todos" },
    { nome: "Saquinhos Higiênicos 120 unidades", preco: 1990, estoque: 60, especie: "cachorro" },
    { nome: "Kit Escova e Pente Pet", preco: 3990, estoque: 17, especie: "todos" },
    { nome: "Focinheira Ajustável M", preco: 3490, estoque: 0, especie: "cachorro" },
  ] },
  racoes: { prefixo: "TESTE-RAC", itens: [
    { nome: "Ração Cães Adultos Porte Pequeno 1kg", preco: 3490, estoque: 50, especie: "cachorro", peso: "1 kg" },
    { nome: "Ração Cães Adultos Porte Grande 10kg", preco: 16990, estoque: 20, especie: "cachorro", peso: "10 kg" },
    { nome: "Ração Gatos Filhotes 1kg", preco: 4290, estoque: 35, especie: "gato", peso: "1 kg" },
    { nome: "Ração Gatos Adultos Peixe 3kg", preco: 9990, estoque: 28, especie: "gato", peso: "3 kg" },
    { nome: "Ração Cães Sênior 7kg", preco: 14990, estoque: 12, especie: "cachorro", peso: "7 kg" },
    { nome: "Sachê Úmido Cães Carne 85g", preco: 490, estoque: 120, especie: "cachorro", peso: "85 g" },
    { nome: "Sachê Úmido Gatos Frango 70g", preco: 450, estoque: 120, especie: "gato", peso: "70 g" },
    { nome: "Ração Pássaros Mistura de Sementes 500g", preco: 1990, estoque: 40, especie: "passaro", peso: "500 g" },
    { nome: "Ração Peixes Tropicais Flocos 50g", preco: 1590, estoque: 0, especie: "peixe", peso: "50 g" },
    { nome: "Ração Cães Filhotes Porte Médio 3kg", preco: 8990, estoque: 24, especie: "cachorro", peso: "3 kg" },
    { nome: "Ração Gatos Castrados Salmão 1kg", preco: 4590, estoque: 30, especie: "gato", peso: "1 kg" },
    { nome: "Ração Cães Light 10kg", preco: 15990, estoque: 11, especie: "cachorro", peso: "10 kg" },
    { nome: "Petisco Ossinho Mastigável 7 unidades", preco: 1490, estoque: 45, especie: "cachorro" },
    { nome: "Petisco Bifinho Cães Frango 60g", preco: 990, estoque: 70, especie: "cachorro", peso: "60 g" },
    { nome: "Petisco Cremoso Gatos Atum 4 unidades", preco: 1290, estoque: 55, especie: "gato" },
    { nome: "Ração Coelhos e Roedores 1kg", preco: 2890, estoque: 21, especie: "roedor", peso: "1 kg" },
    { nome: "Ração Hamster Mistura Premium 400g", preco: 2190, estoque: 18, especie: "roedor", peso: "400 g" },
    { nome: "Ração Cães Raças Pequenas Sênior 1kg", preco: 3990, estoque: 0, especie: "cachorro", peso: "1 kg" },
  ] },
  medicacoes: { prefixo: "TESTE-MED", itens: [
    { nome: "Vermífugo Gatos Comprimido", preco: 3290, estoque: 30, especie: "gato" },
    { nome: "Shampoo Antipulgas 200ml", preco: 3990, estoque: 25, especie: "cachorro", peso: "200 ml" },
    { nome: "Suplemento Vitamínico Cães 60 comprimidos", preco: 5490, estoque: 18, especie: "cachorro" },
    { nome: "Pomada Cicatrizante 30g", preco: 2790, estoque: 20, especie: "todos", peso: "30 g" },
    { nome: "Colírio Veterinário 10ml", preco: 3190, estoque: 14, especie: "todos", peso: "10 ml" },
    { nome: "Anti-inflamatório Veterinário 20mg", preco: 0, estoque: 10, especie: "cachorro", receita: true },
    { nome: "Antibiótico Gatos 50mg", preco: 0, estoque: 10, especie: "gato", receita: true },
    { nome: "Limpa Ouvidos Veterinário 100ml", preco: 3490, estoque: 16, especie: "todos", peso: "100 ml" },
    { nome: "Antipulgas Comprimido Cães Pequenos", preco: 6990, estoque: 0, especie: "cachorro" },
    { nome: "Vermífugo Cães Grandes Comprimido", preco: 4490, estoque: 22, especie: "cachorro" },
    { nome: "Probiótico Pet em Pasta 14g", preco: 3990, estoque: 20, especie: "todos", peso: "14 g" },
    { nome: "Spray Cicatrizante 100ml", preco: 3290, estoque: 17, especie: "todos", peso: "100 ml" },
    { nome: "Condicionador Hidratante Pet 200ml", preco: 2990, estoque: 24, especie: "todos", peso: "200 ml" },
    { nome: "Antisséptico Veterinário 100ml", preco: 2490, estoque: 28, especie: "todos", peso: "100 ml" },
    { nome: "Suplemento Articular Cães 60 comprimidos", preco: 8990, estoque: 9, especie: "cachorro" },
    { nome: "Antialérgico Veterinário 10mg", preco: 0, estoque: 10, especie: "cachorro", receita: true },
    { nome: "Analgésico Veterinário Gotas", preco: 0, estoque: 10, especie: "todos", receita: true },
    { nome: "Soro Fisiológico 100ml", preco: 1590, estoque: 0, especie: "todos", peso: "100 ml" },
  ] },
};

function bancoLocal(): boolean {
  try { return ["localhost", "127.0.0.1", "::1", "[::1]", "db"].includes(new URL(process.env.DATABASE_URL ?? "").hostname); } catch { return false; }
}

async function main() {
  if (process.argv.includes("--auto")) {
    // Chamado pelo "predev": nunca derruba o npm run dev e nunca mexe em banco que não seja local.
    if (process.env.SEED_TESTE_CARROSSEL === "0") return;
    if (!bancoLocal()) { console.log("[seed-teste] banco não é local: produtos de teste NÃO foram criados."); return; }
  }
  if (process.argv.includes("--remover")) {
    const r = await db.delete(produtos).where(like(produtos.sku, "TESTE-%")).returning({ id: produtos.id });
    console.log(`Removidos ${r.length} produtos de teste.`);
    return;
  }
  let criados = 0;
  for (const [slug, { prefixo, itens }] of Object.entries(ITENS)) {
    const [cat] = await db.select().from(categorias).where(eq(categorias.slug, slug)).limit(1);
    if (!cat) { console.warn(`Categoria "${slug}" não existe — rode antes: npm run db:seed`); continue; }
    for (const [i, it] of itens.entries()) {
      const medicacao = slug === "medicacoes";
      const r = await db.insert(produtos).values({
        sku: `${prefixo}-${String(i + 1).padStart(2, "0")}`,
        nome: it.nome, slug: `${slugify(it.nome)}-teste`, categoriaId: cat.id,
        especie: it.especie ?? "todos", marca: it.marca ?? null,
        descricao: "Produto fictício de teste do carrossel. Remova antes de publicar a loja.",
        precoCentavos: it.preco, estoque: it.estoque, tipoVenda: it.receita ? "receita" : "livre",
        registroMapa: medicacao ? "TESTE-0000" : null, pesoVolume: it.peso ?? null, ativo: true,
      }).onConflictDoNothing().returning({ id: produtos.id });
      criados += r.length;
    }
  }
  console.log(`Criados ${criados} produtos de teste (os já existentes foram mantidos).`);
}

main().then(() => process.exit(0)).catch((e) => {
  if (process.argv.includes("--auto")) { console.warn("[seed-teste] não consegui criar os produtos de teste (o banco está no ar?):", e instanceof Error ? e.message : e); process.exit(0); }
  console.error(e); process.exit(1);
});
