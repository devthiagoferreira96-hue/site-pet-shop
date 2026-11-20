/**
 * Leitura do relatório de estoque exportado do SimplesVet.
 * O SimplesVet não oferece API pública: a planilha (.csv ou .xlsx) é o caminho oficial disponível.
 * Esta função recebe as LINHAS já lidas (o .xlsx é lido no servidor com exceljs) e acha as colunas.
 */
const COLUNAS_SKU = ["sku", "codigo", "cod", "codigo interno", "cod. interno", "codigo do produto", "cod produto",
  "referencia", "codigo de barras", "cod. barras", "ean", "gtin"];
const COLUNAS_ESTOQUE = ["estoque", "estoque atual", "quantidade", "qtd", "qtde", "saldo", "saldo atual",
  "quantidade em estoque", "disponivel"];

const norm = (t: unknown) =>
  String(t ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();

function acharColuna(cabecalho: unknown[], candidatos: string[]) {
  const n = cabecalho.map(norm);
  for (const c of candidatos) { const i = n.indexOf(c); if (i >= 0) return i; }
  return -1;
}

function paraInteiro(v: unknown): number {
  if (v === null || v === undefined || String(v).trim() === "") throw new Error("quantidade vazia");
  let t = String(v).trim();
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  if (!Number.isFinite(n)) throw new Error(`quantidade inválida "${v}"`);
  return Math.max(0, Math.floor(n)); // granel fracionado é arredondado para baixo
}

export function interpretarLinhas(linhas: unknown[][]) {
  if (!linhas.length) throw new Error("A planilha está vazia.");
  let iCab = -1, cSku = -1, cEst = -1;
  for (let i = 0; i < Math.min(15, linhas.length); i++) {
    const s = acharColuna(linhas[i], COLUNAS_SKU), e = acharColuna(linhas[i], COLUNAS_ESTOQUE);
    if (s >= 0 && e >= 0) { iCab = i; cSku = s; cEst = e; break; }
  }
  if (iCab < 0)
    throw new Error("Não encontrei as colunas de código e de estoque. A planilha precisa de uma coluna de código " +
      "(ex.: 'Código', 'SKU', 'Código de barras') e uma de quantidade (ex.: 'Estoque', 'Quantidade', 'Saldo').");

  const itens: { sku: string; estoque: number }[] = [];
  const erros: string[] = [];
  linhas.slice(iCab + 1).forEach((linha, idx) => {
    const n = iCab + 2 + idx;
    if (!linha.some((c) => String(c ?? "").trim())) return;
    try {
      let sku = String(linha[cSku] ?? "").trim();
      if (sku.endsWith(".0")) sku = sku.slice(0, -2); // Excel transforma códigos em número
      if (!sku) throw new Error("código vazio");
      itens.push({ sku, estoque: paraInteiro(linha[cEst]) });
    } catch (e) { erros.push(`Linha ${n}: ${(e as Error).message}`); }
  });
  return { itens, erros };
}

/** CSV brasileiro (; ou ,), com aspas. Sem dependências. */
export function lerCsv(texto: string): string[][] {
  texto = texto.replace(/^﻿/, "");
  const primeira = texto.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: string[][] = [];
  let campo = "", linha: string[] = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') aspas = false;
      else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) { linha.push(campo); campo = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else campo += ch;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/** Desconta itens de pedidos ainda não lançados no SimplesVet (aguardando pagamento). */
export function descontarReservados(itens: { sku: string; estoque: number }[], reservados: Map<string, number>) {
  return itens.map((i) => ({ sku: i.sku, estoque: Math.max(0, i.estoque - (reservados.get(i.sku) ?? 0)) }));
}
