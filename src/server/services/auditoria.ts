import { db } from "@/db";
import { auditoria } from "@/db/schema";

/** Trilha das ações administrativas (boa prática LGPD, art. 37). Nunca registre senhas ou dados de cartão. */
export async function auditar(adminId: number | null, acao: string, detalhe = "") {
  await db.insert(auditoria).values({ adminId, acao: acao.slice(0, 60), detalhe: detalhe.slice(0, 500) });
}
