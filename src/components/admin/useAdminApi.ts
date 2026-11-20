"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type RespostaApi } from "../api-cliente";

/** Carrega dados do painel; se a sessão expirou (401), volta para o login. */
export function useDados<T>(caminho: string | null) {
  const router = useRouter();
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState("");
  const recarregar = useCallback(async () => {
    if (!caminho) return;
    const r = await api<T>(caminho);
    if (r.dados !== undefined) { setDados(r.dados); setErro(""); }
    else if (r.erro?.mensagem?.startsWith("Faça login")) router.replace("/admin/login");
    else setErro(r.erro?.mensagem ?? "Erro ao carregar.");
  }, [caminho, router]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { dados, erro, recarregar };
}

export async function enviar<T>(caminho: string, method: string, corpo?: unknown, form?: FormData): Promise<RespostaApi<T>> {
  return api<T>(caminho, { method, corpo, form });
}

export const dataHora = (iso: string | Date | null) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");
