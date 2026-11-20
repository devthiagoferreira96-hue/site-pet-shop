/** Diagnóstico do banco: npm run db:verificar */
import postgres from "postgres";

import { chaveConfigurada } from "../src/domain/cripto";

console.log(chaveConfigurada() ? "✓ DADOS_CHAVE configurada (criptografia dos dados pessoais)."
  : "✗ Falta DADOS_CHAVE no .env → rode: npm run gerar-segredos e copie para o .env");
const url = process.env.DATABASE_URL;
if (!url) { console.error("✗ DATABASE_URL não está no .env. Copie .env.example para .env."); process.exit(1); }
const sql = postgres(url, { max: 1, connect_timeout: 5, ssl: process.env.DATABASE_SSL === "1" ? "require" : undefined });
try {
  await sql`select 1`;
  console.log("✓ Conectou no PostgreSQL.");
} catch (e) {
  const err = e as { code?: string; message: string };
  console.error("✗ Não conectou no PostgreSQL:", err.code ?? "", err.message);
  if (err.code === "ECONNREFUSED") console.error("  → O banco não está rodando. Abra o Docker Desktop e rode: docker compose up -d");
  if (err.code === "28P01") console.error("  → Usuário/senha errados no DATABASE_URL (confira com o docker-compose.yml).");
  if (err.code === "3D000") console.error("  → O banco não existe. Confira o nome no final do DATABASE_URL.");
  process.exit(1);
}
const tabelas = await sql<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public'`;
const nomes = tabelas.map((t) => t.tablename);
const faltando = ["categorias", "produtos", "pedidos", "admins", "credenciais"].filter((t) => !nomes.includes(t));
if (faltando.length) {
  console.error(`✗ Faltam tabelas: ${faltando.join(", ")}.\n  → Rode: npm run db:generate  e depois  npm run db:migrate`);
  process.exit(1);
}
const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from categorias`;
console.log(`✓ Tabelas criadas. Categorias cadastradas: ${n}${n ? "" : "  → rode: npm run db:seed-demo"}`);
const [{ a }] = await sql<{ a: number }[]>`select count(*)::int as a from admins`;
console.log(a ? `✓ ${a} administrador(es).` : "! Nenhum administrador ainda → rode: npm run criar-admin");
await sql.end();
