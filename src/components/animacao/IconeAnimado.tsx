"use client";
/**
 * Ícone animado decorativo (aria-hidden). Diferente do padrão da biblioteca (anima só no hover do próprio
 * ícone), aqui a animação é controlada pelo ELEMENTO PAI: dispara no hover E no foco do teclado.
 * Quem pediu "reduzir movimento" no sistema não vê animação (WCAG 2.3.3).
 */
import { useCallback, useEffect, useRef } from "react";
import { ICONES, type NomeIconeAnimado } from "./icones";

export type ControleIcone = { startAnimation: () => void; stopAnimation: () => void };

function prefereMenosMovimento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function IconeAnimado({ nome, tamanho = 20, controle, className = "" }: {
  nome: NomeIconeAnimado; tamanho?: number; controle?: React.RefObject<ControleIcone | null>; className?: string;
}) {
  const Componente = ICONES[nome];
  return (
    <span className={`icone-animado ${className}`} aria-hidden="true">
      <Componente ref={controle} size={tamanho} />
    </span>
  );
}

/** Liga a animação do ícone ao hover/foco de um link ou botão: <a {...gatilhos}><IconeAnimado controle={controle} /></a> */
export function useAnimarIcone() {
  const controle = useRef<ControleIcone | null>(null);
  const iniciar = useCallback(() => { if (!prefereMenosMovimento()) controle.current?.startAnimation(); }, []);
  const parar = useCallback(() => controle.current?.stopAnimation(), []);
  return { controle, iniciar, gatilhos: { onMouseEnter: iniciar, onMouseLeave: parar, onFocus: iniciar, onBlur: parar } };
}

/** Anima uma vez quando o ícone aparece na tela (ao rolar). */
export function IconeAoAparecer({ nome, tamanho = 32, className = "" }: { nome: NomeIconeAnimado; tamanho?: number; className?: string }) {
  const { controle, iniciar } = useAnimarIcone();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { iniciar(); obs.disconnect(); } }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [iniciar]);
  return <span ref={ref}><IconeAnimado nome={nome} tamanho={tamanho} controle={controle} className={className} /></span>;
}

/** Anima ao montar (ex.: confirmação de pedido). */
export function IconeAoMontar({ nome, tamanho = 48, className = "" }: { nome: NomeIconeAnimado; tamanho?: number; className?: string }) {
  const { controle, iniciar } = useAnimarIcone();
  useEffect(() => { const t = setTimeout(iniciar, 150); return () => clearTimeout(t); }, [iniciar]);
  return <IconeAnimado nome={nome} tamanho={tamanho} controle={controle} className={className} />;
}
