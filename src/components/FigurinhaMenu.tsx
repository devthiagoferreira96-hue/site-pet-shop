"use client";
/**
 * Figurinhas do menu principal: aparecem à esquerda do texto quando o mouse (ou o foco do teclado) está no item.
 * Puramente decorativas (aria-hidden). A animação de "pop" (aparecer/sumir) fica no CSS (.menu-fig em globals.css).
 *
 * - Cão e Gato usam uma animação em imagem (WebP animado com fundo transparente, em public/img/menu/):
 *   a imagem só é montada enquanto o item está em hover/foco, então a animação sempre começa do início.
 * - Início, Loja, Sobre e Contato usam uma animação Lottie (public/img/menu/*.json), desenhada pela biblioteca lottie-web (carregada só quando precisa).
 * - Todas animam mesmo com "reduzir movimento" ligado no sistema (escolha do dono do site).
 *
 * `texto` é uma versão mais escura da cor da figurinha, usada no rótulo: o tom claro da figurinha
 * não teria contraste suficiente (WCAG 1.4.3) para texto pequeno.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AnimationItem } from "lottie-web";

export type ChaveMenu = "inicio" | "loja" | "cao" | "gato" | "sobre" | "contato";

export const COR_MENU: Record<ChaveMenu, { fig: string; texto: string }> = {
  inicio: { fig: "#2DB7CF", texto: "#0E6B82" },
  loja: { fig: "#F5A524", texto: "#9A5200" },
  cao: { fig: "#F0705A", texto: "#B83A1F" },
  gato: { fig: "#D9A877", texto: "#8A5A2B" },
  sobre: { fig: "#EC5C8A", texto: "#B3174F" },
  contato: { fig: "#2DBE6C", texto: "#13763D" },
};

/** Variáveis CSS que o item do menu usa no hover (cor do rótulo). */
export function estiloItemMenu(chave: ChaveMenu): CSSProperties {
  return { "--cor-hover": COR_MENU[chave].texto } as CSSProperties;
}

/** Itens com animação em imagem (arquivo em public/img/menu/). */
type ChaveAnimada = "cao" | "gato";
export const ANIMACOES_MENU: Record<ChaveAnimada, string> = {
  cao: "/img/menu/cao.webp",
  gato: "/img/menu/gato.webp",
};
const ehAnimada = (c: ChaveMenu): c is ChaveAnimada => c in ANIMACOES_MENU;

/** Itens com animação Lottie (JSON) em vez de imagem. */
type ChaveLottie = "inicio" | "loja" | "sobre" | "contato";
export const LOTTIES_MENU: Record<ChaveLottie, string> = {
  inicio: "/img/menu/inicio.json",
  loja: "/img/menu/loja.json",
  sobre: "/img/menu/sobre.json", // pessoa preenchendo uma prancheta (LottieFiles "Business plan", recortado)
  contato: "/img/menu/contato.json", // telefone (LottieFiles "Contact Us", recortado: sem o texto e sem a sombra)
};
const ehLottie = (c: ChaveMenu): c is ChaveLottie => c in LOTTIES_MENU;

/** Pré-carrega o que as figurinhas animadas usam, para o 1º hover não esperar o download. */
export function preCarregarFigurinhas() {
  Object.values(ANIMACOES_MENU).forEach((src) => { new Image().src = src; });
  Object.values(LOTTIES_MENU).forEach((src) => { void fetch(src).catch(() => {}); });
  void import("lottie-web").catch(() => {});
}

/** Mantém a animação montada por ~0,4 s depois que o mouse sai, para a figurinha encolher em vez de sumir de uma vez. */
function useMontada(ativa: boolean) {
  const [montada, setMontada] = useState(ativa);
  useEffect(() => {
    if (ativa) { setMontada(true); return; }
    const t = setTimeout(() => setMontada(false), 450);
    return () => clearTimeout(t);
  }, [ativa]);
  return ativa || montada;
}

function FigurinhaAnimada({ chave, ativa }: { chave: ChaveAnimada; ativa: boolean }) {
  const montada = useMontada(ativa);
  return (
    <span className={`menu-fig menu-fig--${chave}`} aria-hidden="true">
      {montada && <img className="menu-fig__anim" src={ANIMACOES_MENU[chave]} alt="" width={144} height={144} decoding="async" draggable={false} />}
    </span>
  );
}

/** Início, Loja, Sobre e Contato: animação Lottie. Toca ao entrar no item e repete (com uma pausa) enquanto o mouse estiver nele. */
function FigurinhaLottie({ chave, ativa }: { chave: ChaveLottie; ativa: boolean }) {
  const montada = useMontada(ativa);
  const caixa = useRef<HTMLDivElement>(null);
  const ativaRef = useRef(ativa);
  ativaRef.current = ativa;
  useEffect(() => {
    if (!montada || !caixa.current) return;
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let anim: AnimationItem | undefined;
    (async () => {
      const { default: lottie } = await import("lottie-web");
      if (!vivo || !caixa.current) return;
      anim = lottie.loadAnimation({
        container: caixa.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: LOTTIES_MENU[chave],
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      anim.addEventListener("complete", () => {
        timer = setTimeout(() => { if (vivo && ativaRef.current) anim?.goToAndPlay(0, true); }, 700);
      });
    })();
    return () => { vivo = false; if (timer) clearTimeout(timer); anim?.destroy(); };
  }, [montada, chave]);
  return (
    <span className={`menu-fig menu-fig--${chave}`} aria-hidden="true">
      {montada && <div ref={caixa} className="menu-fig__lottie" />}
    </span>
  );
}

export function FigurinhaMenu({ chave, ativa = false }: { chave: ChaveMenu; ativa?: boolean }) {
  if (ehLottie(chave)) return <FigurinhaLottie chave={chave} ativa={ativa} />;
  if (ehAnimada(chave)) return <FigurinhaAnimada chave={chave} ativa={ativa} />;
  return null;
}
