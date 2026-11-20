/** Cria as categorias padrão. Com --demo, cadastra os 9 produtos FICTÍCIOS do projeto Lovable. */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias, produtos } from "@/db/schema";
import { CATEGORIAS_PADRAO, slugify, type TipoVenda } from "@/domain/regras";

for (const c of CATEGORIAS_PADRAO) await db.insert(categorias).values(c).onConflictDoNothing();
console.log("Categorias prontas.");

if (process.argv.includes("--demo")) {
  const cat = new Map((await db.select().from(categorias)).map((c) => [c.slug, c.id]));
  const demo: [string, string, string, string, number, number, TipoVenda, string | null, string, string][] = [
    ["DEMO-001", "Ração Premium Cães Adultos 15kg", "racoes", "cachorro", 21990, 12, "livre", null, "15 kg", "Ração com frango e arroz para cães adultos de porte médio e grande."],
    ["DEMO-002", "Ração Gatos Castrados 10kg", "racoes", "gato", 18990, 8, "livre", null, "10 kg", "Fórmula para gatos castrados."],
    ["DEMO-003", "Ração Filhotes 3kg", "racoes", "cachorro", 7990, 20, "livre", null, "3 kg", "Alimento completo para filhotes."],
    ["DEMO-004", "Coleira Ajustável Turquesa", "acessorios", "cachorro", 3490, 30, "livre", null, "M", "Coleira em nylon com fivela de engate rápido."],
    ["DEMO-005", "Cama Pet Nuvem M", "acessorios", "todos", 14990, 6, "livre", null, "M", "Cama macia e lavável para cães e gatos."],
    ["DEMO-006", "Arranhador Torre para Gatos", "acessorios", "gato", 12990, 4, "livre", null, "80 cm", "Arranhador com plataformas e brinquedo pendurado."],
    ["DEMO-007", "Vermífugo Comprimido Cães", "medicacoes", "cachorro", 3990, 25, "livre", "PREENCHER-REG-MAPA", "4 comprimidos", "Vermífugo de venda livre. Confira a bula e o peso do animal."],
    ["DEMO-008", "Antipulgas Pipeta Gatos", "medicacoes", "gato", 5990, 18, "livre", "PREENCHER-REG-MAPA", "1 pipeta", "Antipulgas de uso tópico de venda livre. Siga a bula."],
    ["DEMO-009", "Antibiótico Veterinário 250mg", "medicacoes", "cachorro", 8990, 10, "receita", "PREENCHER-REG-MAPA", "10 comprimidos", "Exige receita veterinária. Venda somente na loja física."],
  ];
  for (const [sku, nome, c, especie, preco, estoque, tipoVenda, registroMapa, pesoVolume, desc] of demo) {
    const [existe] = await db.select({ id: produtos.id }).from(produtos).where(eq(produtos.sku, sku)).limit(1);
    if (existe) continue;
    await db.insert(produtos).values({
      sku, nome, slug: slugify(nome), categoriaId: cat.get(c)!, especie, marca: "Marca exemplo",
      descricao: `${desc} (Produto fictício de demonstração.)`, precoCentavos: preco, estoque, tipoVenda, registroMapa, pesoVolume,
    });
  }
  console.log("Produtos de demonstração cadastrados. APAGUE-OS antes de publicar o site.");
}
process.exit(0);
