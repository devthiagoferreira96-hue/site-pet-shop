/**
 * Cifra os dados pessoais que já estavam no banco ANTES da criptografia e refaz os índices de e-mail.
 * Também serve para TROCAR A CHAVE: ponha a chave antiga em DADOS_CHAVE_ANTERIOR, a nova em DADOS_CHAVE e rode de novo.
 * Uso (com o dono do banco):  npm run db:criptografar
 * Pode rodar várias vezes: o que já está cifrado com a chave atual é só regravado.
 */
import postgres from "postgres";
import { cifrar, decifrar, indiceEmail } from "../src/domain/cripto";

const url = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
if (!url) { console.error("Defina DATABASE_ADMIN_URL (ou DATABASE_URL) no .env."); process.exit(1); }
const sql = postgres(url, { max: 1, ssl: process.env.DATABASE_SSL === "1" ? "require" : undefined, onnotice: () => {} });

// valor ausente ou marcador de anonimização: fica como está
const recifrar = (v: string | null, ctx: string) => (v === null || v === "anonimizado" ? v : cifrar(decifrar(v, ctx), ctx));

try {
  await sql.begin(async (tx) => {
    // a trava contra adulteração (scripts/seguranca-banco.sql) impediria esta migração; desliga só durante ela
    const [trava] = await tx`select 1 from pg_trigger where tgname = 'ma_pedido_protegido'`;
    if (trava) await tx`alter table pedidos disable trigger ma_pedido_protegido`;

    const peds = await tx<{ id: number; email: string; telefone: string; cpf: string | null; endereco: string | null; anonimizado: boolean }[]>`
      select id, email, telefone, cpf, endereco, anonimizado from pedidos`;
    for (const p of peds) {
      const email = p.anonimizado ? p.email : recifrar(p.email, "pedidos.email");
      const hash = p.anonimizado ? null : indiceEmail(decifrar(p.email, "pedidos.email"));
      await tx`update pedidos set email = ${email}, email_hash = ${hash},
        telefone = ${p.anonimizado ? p.telefone : recifrar(p.telefone, "pedidos.telefone")},
        cpf = ${recifrar(p.cpf, "pedidos.cpf")}, endereco = ${recifrar(p.endereco, "pedidos.endereco")} where id = ${p.id}`;
    }
    for (const tabela of ["contatos", "solicitacoes"] as const) {
      const linhas = await tx<{ id: number; email: string }[]>`select id, email from ${tx(tabela)}`;
      for (const l of linhas) {
        await tx`update ${tx(tabela)} set email = ${recifrar(l.email, `${tabela}.email`)},
          email_hash = ${indiceEmail(decifrar(l.email, `${tabela}.email`))} where id = ${l.id}`;
      }
      console.log(`✓ ${tabela}: ${linhas.length} registro(s)`);
    }
    if (trava) await tx`alter table pedidos enable trigger ma_pedido_protegido`;
    console.log(`✓ pedidos: ${peds.length} registro(s)`);
  });
  console.log("Pronto. Se trocou a chave, depois de conferir o site já pode remover DADOS_CHAVE_ANTERIOR do .env.");
} catch (e) {
  console.error("Falhou (nada foi alterado):", (e as Error).message);
  process.exit(1);
} finally {
  await sql.end();
}
