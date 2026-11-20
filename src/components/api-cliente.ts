/** Cliente da API para os componentes do navegador (o app pode usar a mesma lógica com fetch + Bearer). */
export type RespostaApi<T> = { dados?: T; erro?: { mensagem: string; campos?: Record<string, string> } };

export async function api<T = unknown>(caminho: string, opcoes: { method?: string; corpo?: unknown; form?: FormData } = {}): Promise<RespostaApi<T>> {
  try {
    const res = await fetch(`/api/v1${caminho}`, {
      method: opcoes.method ?? (opcoes.corpo || opcoes.form ? "POST" : "GET"),
      headers: opcoes.corpo ? { "Content-Type": "application/json" } : undefined,
      body: opcoes.form ?? (opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined),
      credentials: "same-origin",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as RespostaApi<T>;
    if (!res.ok && !json.erro) return { erro: { mensagem: `Erro ${res.status}. Tente novamente.` } };
    return json;
  } catch {
    return { erro: { mensagem: "Sem conexão com o servidor. Verifique sua internet e tente novamente." } };
  }
}

export function brl(centavos: number | null | undefined): string {
  const c = Math.trunc(centavos ?? 0);
  return `${c < 0 ? "-" : ""}R$ ${Math.floor(Math.abs(c) / 100).toLocaleString("pt-BR")},${String(Math.abs(c) % 100).padStart(2, "0")}`;
}
