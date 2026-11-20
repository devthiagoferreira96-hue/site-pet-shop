/** Importação do estoque a partir da planilha exportada do SimplesVet (.xlsx ou .csv). */
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { produtos, syncLogs } from "@/db/schema";
import { descontarReservados, interpretarLinhas, lerCsv } from "@/domain/planilha-estoque";
import { reservadosPorSku } from "./pedidos";
import { auditar } from "./auditoria";

async function lerArquivo(nome: string, conteudo: ArrayBuffer): Promise<unknown[][]> {
  const n = nome.toLowerCase();
  if (n.endsWith(".csv")) {
    const bytes = new Uint8Array(conteudo);
    let texto: string;
    try { texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
    catch { texto = new TextDecoder("latin1").decode(bytes); } // planilhas antigas do Excel
    return lerCsv(texto);
  }
  if (n.endsWith(".xlsx")) {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(conteudo);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const linhas: unknown[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const valores = (row.values as unknown[]).slice(1).map((v) =>
        v && typeof v === "object" && "result" in (v as object) ? (v as { result: unknown }).result : v);
      linhas.push(valores);
    });
    return linhas;
  }
  throw new Error("Formato não suportado. Envie um arquivo .xlsx ou .csv exportado do SimplesVet.");
}

export async function importarPlanilha(nome: string, conteudo: ArrayBuffer, adminId: number) {
  const linhas = await lerArquivo(nome, conteudo);
  const { itens, erros } = interpretarLinhas(linhas);
  const reservados = await reservadosPorSku();
  const ajustados = descontarReservados(itens, reservados);
  let atualizados = 0;
  const naoEncontrados: string[] = [];
  await db.transaction(async (tx) => {
    for (const it of ajustados) {
      const r = await tx.update(produtos).set({ estoque: it.estoque, atualizadoEm: new Date() }).where(eq(produtos.sku, it.sku)).returning({ id: produtos.id });
      if (r.length) atualizados++; else naoEncontrados.push(it.sku);
    }
  });
  await db.insert(syncLogs).values({ origem: `planilha:${nome.slice(0, 100)}`, atualizados, naoEncontrados: naoEncontrados.length, erros: erros.join("\n").slice(0, 4000), adminId });
  await auditar(adminId, "estoque_importado", `${atualizados} atualizados`);
  return { atualizados, naoEncontrados: naoEncontrados.slice(0, 200), erros: erros.slice(0, 200), reservadosDescontados: Object.fromEntries(reservados) };
}

export const historicoImportacoes = () => db.select().from(syncLogs).orderBy(desc(syncLogs.id)).limit(10);
