import { defineConfig } from "drizzle-kit";

// O drizzle-kit NÃO lê o arquivo .env sozinho (o Next lê, o drizzle-kit não). Carregamos aqui.
try { process.loadEnvFile(".env"); } catch { /* sem .env: usa as variáveis do sistema */ }
if (!process.env.DATABASE_ADMIN_URL && !process.env.DATABASE_URL) throw new Error("DATABASE_URL não definido. Copie .env.example para .env e preencha.");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL },
});
