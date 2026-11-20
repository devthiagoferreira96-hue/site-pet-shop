"use client";
/** Região "ao vivo" para leitores de tela anunciarem ações (ex.: "Adicionado ao carrinho"). */
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});
export function AnunciadorProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const anunciar = useCallback((m: string) => { setMsg(""); setTimeout(() => setMsg(m), 50); }, []);
  return (<Ctx.Provider value={anunciar}>{children}<div className="sr-only" role="status" aria-live="polite">{msg}</div></Ctx.Provider>);
}
export const useAnunciar = () => useContext(Ctx);
