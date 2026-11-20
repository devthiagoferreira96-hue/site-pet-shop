/** Dinheiro sempre em CENTAVOS (inteiro) para evitar erros de arredondamento de float. */

export function brl(centavos: number): string {
  const c = Math.trunc(centavos || 0);
  const sinal = c < 0 ? "-" : "";
  const abs = Math.abs(c);
  const reais = Math.floor(abs / 100).toLocaleString("pt-BR");
  return `${sinal}R$ ${reais},${String(abs % 100).padStart(2, "0")}`;
}

/** Converte "1.234,56", "89,90" ou "89.90" em centavos. Lança erro se inválido. */
export function parsePreco(texto: string): number {
  let t = String(texto ?? "").trim().replace(/R\$|\s/g, "");
  if (!t) throw new Error("Preço vazio");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) throw new Error("Preço inválido");
  return Math.round(Number(t) * 100);
}
