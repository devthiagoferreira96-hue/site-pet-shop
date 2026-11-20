/**
 * Aplica a segurança do banco: papéis com menor privilégio, RLS, logs imutáveis e bloqueio de adulteração.
 * Uso (depois de npm run db:migrate):  npm run db:seguranca
 *
 * Precisa no .env:
 *   DATABASE_ADMIN_URL   conexão do DONO do banco (só para migrações, seed e este script)
 *   DB_SENHA_APP         senha do papel ma_app (o site usa este papel)
 *   DB_SENHA_MANUTENCAO  senha do papel ma_manutencao (scripts de retenção e criar-admin)
 * Gere senhas fortes com: npm run gerar-segredos
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const adminUrl = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
if (!adminUrl) { console.error("Defina DATABASE_ADMIN_URL no .env (conexão do dono do banco)."); process.exit(1); }

// Só letras, números, _ e -, com 24+ caracteres: assim a senha pode entrar no comando sem risco de injeção.
const SENHA_SEGURA = /^[A-Za-z0-9_-]{24,128}$/;
const senhas = { ma_app: process.env.DB_SENHA_APP ?? "", ma_manutencao: process.env.DB_SENHA_MANUTENCAO ?? "" };
for (const [papel, senha] of Object.entries(senhas)) {
  if (!SENHA_SEGURA.test(senha)) {
    console.error(`A senha do papel ${papel} precisa ter 24+ caracteres, só letras, números, "_" ou "-". Rode: npm run gerar-segredos`);
    process.exit(1);
  }
}

const sql = postgres(adminUrl, { max: 1, ssl: process.env.DATABASE_SSL === "1" ? "require" : undefined, onnotice: () => {} });
try {
  const [{ banco }] = await sql<{ banco: string }[]>`select current_database() as banco`;
  for (const [papel, senha] of Object.entries(senhas)) {
    const [existe] = await sql`select 1 from pg_roles where rolname = ${papel}`;
    // Nome do papel é fixo no código e a senha foi validada acima (sem aspas): seguro para montar o comando.
    // Na criação definimos os atributos mínimos; na atualização só trocamos a senha (mudar atributos exige superusuário).
    await sql.unsafe(existe
      ? `ALTER ROLE ${papel} WITH LOGIN PASSWORD '${senha}'`
      : `CREATE ROLE ${papel} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT PASSWORD '${senha}'`);
    await sql.unsafe(`GRANT CONNECT ON DATABASE "${banco.replace(/"/g, '""')}" TO ${papel}`);
    console.log(`✓ papel ${papel} ${existe ? "atualizado" : "criado"}`);
  }
  await sql.unsafe(readFileSync(new URL("./seguranca-banco.sql", import.meta.url), "utf8"));
  const rls = await sql<{ tabela: string; rls: boolean }[]>`
    select c.relname as tabela, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by 1`;
  for (const t of rls) console.log(`${t.rls ? "✓" : "✗"} RLS ${t.rls ? "ligado" : "DESLIGADO"} em ${t.tabela}`);
  // confere se os papéis do site não têm poderes demais (ex.: criados à mão antes)
  const poderes = await sql<{ rolname: string }[]>`select rolname from pg_roles where rolname in ('ma_app','ma_manutencao') and (rolsuper or rolbypassrls or rolcreaterole or rolcreatedb)`;
  if (poderes.length) { console.error(`Os papéis ${poderes.map((p) => p.rolname).join(", ")} têm privilégios demais (superuser/bypassrls/createrole/createdb). Remova-os.`); process.exit(1); }
  const semRls = rls.filter((t) => !t.rls && !t.tabela.startsWith("__drizzle"));
  if (semRls.length) { console.error("Tabelas sem RLS: " + semRls.map((t) => t.tabela).join(", ")); process.exit(1); }
  const u = new URL(adminUrl);
  console.log(`\nPronto. Agora use no .env do SITE:\n  DATABASE_URL=postgres://ma_app:<DB_SENHA_APP>@${u.host}${u.pathname}`);
  console.log(`E para os scripts de retenção/criar-admin:\n  DATABASE_MANUTENCAO_URL=postgres://ma_manutencao:<DB_SENHA_MANUTENCAO>@${u.host}${u.pathname}`);
} catch (e) {
  console.error("Falhou:", (e as Error).message);
  process.exit(1);
} finally {
  await sql.end();
}
