"use client";
/**
 * Banners de destaque: trocam sozinhos (próximo banner ALEATÓRIO) a cada poucos segundos e têm setas
 * para voltar/avançar. Acessível: botão Pausar/Continuar (WCAG 2.2.2), pausa com mouse em cima e com foco
 * dentro, só um banner é lido/focado por vez, e a troca é só um esmaecer (sem deslizar), então vale
 * também para quem usa "reduzir movimento".
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Icone } from "./Icone";
import { LinkAnimado } from "./animacao/Animados";
import type { Destaque } from "@/config/destaque";

export function BannersDestaque({ banners, intervalo }: { banners: Destaque[]; intervalo: number }) {
  const [atual, setAtual] = useState(0);
  const [tocando, setTocando] = useState(true);
  const raiz = useRef<HTMLElement>(null);
  const pausas = useRef({ mouse: false, foco: false, visivel: true });
  const total = banners.length;

  const irPara = useCallback((i: number) => setAtual(((i % total) + total) % total), [total]);
  const proximoAleatorio = useCallback(() => setAtual((a) => {
    if (total < 2) return a;
    let n = a; while (n === a) n = Math.floor(Math.random() * total); return n;
  }), [total]);

  // troca automática; reinicia a contagem a cada mudança de banner (inclusive quando a pessoa usa as setas)
  useEffect(() => {
    if (!tocando || total < 2) return;
    const t = setInterval(() => {
      const p = pausas.current;
      if (!p.mouse && !p.foco && p.visivel && !document.hidden) proximoAleatorio();
    }, intervalo);
    return () => clearInterval(t);
  }, [tocando, total, intervalo, atual, proximoAleatorio]);

  useEffect(() => {
    const el = raiz.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { pausas.current.visivel = e.isIntersecting; });
    io.observe(el); return () => io.disconnect();
  }, []);

  if (!total) return null;
  return (
    <section ref={raiz} className="destaques" role="region" aria-roledescription="carrossel" aria-label="Destaques da loja"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") pausas.current.mouse = true; }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") pausas.current.mouse = false; }}
      onFocusCapture={() => { pausas.current.foco = true; }} onBlurCapture={() => { pausas.current.foco = false; }}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") irPara(atual - 1); if (e.key === "ArrowRight") irPara(atual + 1); }}>
      <div className="destaques__lista" aria-live={tocando ? "off" : "polite"}>
        {banners.map((b, i) => {
          const ativo = i === atual;
          return (
            <article key={b.id} className={`destaque${ativo ? " destaque--ativo" : ""}`} role="group" aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}`} aria-hidden={!ativo} inert={!ativo}>
              <div className="destaque__texto">
                <p className="eyebrow">{b.selo}</p>
                {b.chamada && <p className="destaque__chamada">{b.chamada}</p>}
                <h2>{b.titulo}</h2>
                <p className="destaque__descricao">{b.texto}</p>
                <LinkAnimado className="botao botao--hero botao--grande" href={b.href} icone="seta">{b.botao}</LinkAnimado>
              </div>
              <div className="destaque__foto">
                <img src={b.imagem} alt={b.imagemAlt} width={1400} height={935} loading={i === 0 ? "eager" : "lazy"} />
              </div>
            </article>
          );
        })}
      </div>
      {total > 1 && (
        <>
          <button type="button" className="destaques__seta destaques__seta--ant" aria-label="Banner anterior" onClick={() => irPara(atual - 1)}><Icone nome="seta" /></button>
          <button type="button" className="destaques__seta destaques__seta--prox" aria-label="Próximo banner" onClick={() => irPara(atual + 1)}><Icone nome="seta" /></button>
          <div className="destaques__controles">
            {banners.map((b, i) => (
              <button key={b.id} type="button" className={`destaques__ponto${i === atual ? " destaques__ponto--ativo" : ""}`}
                aria-label={`Ir para o banner ${i + 1} de ${total}`} aria-current={i === atual} onClick={() => irPara(i)} />
            ))}
            <button type="button" className="destaques__pausa" onClick={() => setTocando((t) => !t)}>{tocando ? "Pausar" : "Continuar"}</button>
          </div>
        </>
      )}
    </section>
  );
}
