"use client";
import { useEffect, useState } from "react";
import { api } from "../api-cliente";
import { useCarrinho } from "../Carrinho";

export type Cotacao = {
  itens: { produtoId: number; nome: string; slug: string; quantidade: number; precoUnitCentavos: number; totalCentavos: number; estoqueDisponivel: number; imagemUrl: string | null }[];
  recusados: { produtoId: number; motivo: string }[];
  subtotalCentavos: number; freteCentavos: number; totalCentavos: number;
};

/** Pede ao servidor a cotação do carrinho (preços e estoque reais). */
export function useCotacao(modalidade: "retirada" | "entrega" = "retirada") {
  const { itens, pronto } = useCarrinho();
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const chave = JSON.stringify(itens);

  useEffect(() => {
    if (!pronto) return;
    if (!itens.length) { setCotacao(null); setCarregando(false); return; }
    let ativo = true;
    setCarregando(true);
    api<Cotacao>("/carrinho/cotacao", { corpo: { itens, modalidade } }).then((r) => {
      if (!ativo) return;
      if (r.dados) { setCotacao(r.dados); setErro(""); } else setErro(r.erro?.mensagem ?? "Erro ao calcular o carrinho.");
      setCarregando(false);
    });
    return () => { ativo = false; };
  }, [chave, pronto, modalidade]); // eslint-disable-line react-hooks/exhaustive-deps

  return { cotacao, erro, carregando };
}
