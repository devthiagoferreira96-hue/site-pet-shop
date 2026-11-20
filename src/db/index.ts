import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Conexão com o PostgreSQL. O driver só conecta na primeira consulta, então o `next build`
 * funciona mesmo sem banco. Em produção, src/instrumentation.ts impede o servidor de subir sem DATABASE_URL.
 */
// Cada parte do sistema usa um papel do banco com o mínimo de permissão (veja scripts/seguranca-banco.sql):
//   site -> DATABASE_URL (papel ma_app) · scripts de retenção/criar-admin -> DATABASE_MANUTENCAO_URL · migrações/seed -> DATABASE_ADMIN_URL
// MA_DB é definido pelos scripts (scripts/usar-db-*.mjs). Sem as URLs extras, tudo usa DATABASE_URL (prático no seu PC).
const papel = process.env.MA_DB;
const url = (papel === "admin" ? process.env.DATABASE_ADMIN_URL : papel === "manutencao" ? process.env.DATABASE_MANUTENCAO_URL : undefined)
  || process.env.DATABASE_URL || "postgres://definir-DATABASE_URL-no-env@localhost:5432/x";

// Reaproveita a conexão entre recargas do Next em desenvolvimento.
const globalParaDb = globalThis as unknown as { _maSql?: ReturnType<typeof postgres> };
const sql = globalParaDb._maSql ?? postgres(url, { max: 10, ssl: process.env.DATABASE_SSL === "1" ? "require" : undefined });
if (process.env.NODE_ENV !== "production") globalParaDb._maSql = sql;

export const db = drizzle(sql, { schema });
export type DB = typeof db;
export { schema };
