"use client";
/**
 * Carrinho no dispositivo (localStorage): guarda SÓ ids e quantidades — nenhum dado pessoal e nenhum preço.
 * Preços e disponibilidade sempre vêm da API (/api/v1/carrinho/cotacao).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ItemCarrinho = { produtoId: number; quantidade: number };
type Ctx = { itens: ItemCarrinho[]; quantidadeTotal: number; pronto: boolean;
  adicionar: (produtoId: number, qtd?: number) => void; definir: (produtoId: number, qtd: number) => void;
  remover: (produtoId: number) => void; limpar: () => void };

const CarrinhoCtx = createContext<Ctx | null>(null);
const CHAVE = "ma_carrinho";

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
      if (Array.isArray(bruto)) setItens(bruto.filter((i) => Number.isInteger(i?.produtoId) && Number.isInteger(i?.quantidade) && i.quantidade > 0).slice(0, 50));
    } catch { /* armazenamento indisponível: carrinho só nesta aba */ }
    setPronto(true);
  }, []);
  useEffect(() => { if (pronto) try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch { /* ignora */ } }, [itens, pronto]);

  const definir = useCallback((produtoId: number, qtd: number) => setItens((atual) => {
    const q = Math.max(0, Math.min(20, Math.floor(qtd)));
    const sem = atual.filter((i) => i.produtoId !== produtoId);
    return q ? [...sem, { produtoId, quantidade: q }] : sem;
  }), []);
  const adicionar = useCallback((produtoId: number, qtd = 1) => setItens((atual) => {
    const ex = atual.find((i) => i.produtoId === produtoId);
    const q = Math.min(20, (ex?.quantidade ?? 0) + qtd);
    return ex ? atual.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: q } : i)) : [...atual, { produtoId, quantidade: q }];
  }), []);
  const remover = useCallback((produtoId: number) => setItens((a) => a.filter((i) => i.produtoId !== produtoId)), []);
  const limpar = useCallback(() => setItens([]), []);

  const valor = useMemo(() => ({ itens, pronto, adicionar, definir, remover, limpar,
    quantidadeTotal: itens.reduce((s, i) => s + i.quantidade, 0) }), [itens, pronto, adicionar, definir, remover, limpar]);
  return <CarrinhoCtx.Provider value={valor}>{children}</CarrinhoCtx.Provider>;
}

export function useCarrinho() {
  const c = useContext(CarrinhoCtx);
  if (!c) throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider");
  return c;
}
