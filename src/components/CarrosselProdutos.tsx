"use client";
/**
 * "Nossos produtos": uma fileira horizontal por categoria que anda sozinha, bem devagar, todas para o mesmo lado.
 *  - O movimento é só automático: a pessoa NÃO controla com rolagem, arrastar nem setas do teclado.
 *  - Pausa quando o mouse está em cima de um produto (e enquanto um dedo toca um produto), com foco por teclado
 *    dentro da fileira (quem navega com Tab precisa de tudo parado) e fora da tela.
 *  - Botão "Pausar/Iniciar movimento" sempre visível (WCAG 2.2.2). Com "reduzir movimento" ligado no sistema, NÃO começa sozinho:
 *    a pessoa inicia com o botão.
 *  - As cópias usadas para o loop ficam com aria-hidden e tabindex=-1: leitor de tela e Tab só veem cada produto uma vez.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CartaoProduto, type ProdutoCartao } from "./CartaoProduto";
import { Icone } from "./Icone";

export type FileiraProdutos = { slug: string; nome: string; foto?: string | null; fundo?: string | null; itens: ProdutoCartao[] };

const VELOCIDADE = 14;      // px por segundo (bem devagar)
const MIN_POR_GRUPO = 8;    // cartões por grupo, para o loop nunca mostrar vazio

function Fileira({ fileira, sentido, rodando }: { fileira: FileiraProdutos; sentido: 1 | -1; rodando: boolean }) {
  const pista = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const rodandoRef = useRef(rodando);
  rodandoRef.current = rodando;
  const { itens } = fileira;
  const copias = Math.max(1, Math.ceil(MIN_POR_GRUPO / itens.length));

  useEffect(() => {
    const el = pista.current, ul = lista.current;
    if (!el || !ul) return;
    let x = 0, ultimo = 0, raf = 0;
    let visivel = false, sobre = false, comFoco = false;
    const metade = () => ul.scrollWidth / 2;
    const normalizar = () => { const m = metade(); if (m > 0) x = ((x % m) + m) % m; };

    // começa com o primeiro cartão alinhado à esquerda da fileira (largura do conteúdo)
    x = 0; normalizar(); el.scrollLeft = x;

    // cópias do loop: fora do Tab (continuam com mouse, mas sem aparecer para teclado/leitor de tela)
    const tirarDoTab = () => ul.querySelectorAll<HTMLElement>("[data-copia] :is(a, button, input, select, textarea, [tabindex]):not([tabindex='-1'])").forEach((n) => n.setAttribute("tabindex", "-1"));
    tirarDoTab();
    const mo = new MutationObserver(tirarDoTab);
    mo.observe(ul, { childList: true, subtree: true });

    // o scroll só muda por foco de teclado (Tab até um botão fora da vista): sincroniza para não "pular"
    const aoRolarPista = () => { if (Math.abs(el.scrollLeft - x) > 2) { x = el.scrollLeft; normalizar(); if (Math.abs(el.scrollLeft - x) > 1) el.scrollLeft = x; } };
    const quadro = (t: number) => {
      const dt = Math.min(0.1, (t - (ultimo || t)) / 1000); ultimo = t;
      if (rodandoRef.current && visivel && !sobre && !comFoco && !document.hidden) {
        x += VELOCIDADE * dt * sentido; normalizar(); el.scrollLeft = x;
      }
      raf = requestAnimationFrame(quadro);
    };

    const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { threshold: 0 });
    io.observe(el);
    // pausa só com o ponteiro EM CIMA de um produto (no espaço entre cartões ou fora da fileira, volta a andar)
    const emCartao = (e: Event) => Boolean((e.target as Element | null)?.closest?.("li"));
    const aoPassar = (e: PointerEvent) => { if (e.pointerType !== "touch") sobre = emCartao(e); };
    const aoSair = (e: PointerEvent) => { if (e.pointerType !== "touch") sobre = false; };
    const aoTocar = (e: PointerEvent) => { if (e.pointerType === "touch") sobre = emCartao(e); };
    const aoSoltar = (e: PointerEvent) => { if (e.pointerType === "touch") sobre = false; };
    const focoDentro = () => { comFoco = true; };
    const focoFora = () => { comFoco = false; };
    el.addEventListener("scroll", aoRolarPista, { passive: true });
    el.addEventListener("pointerover", aoPassar); el.addEventListener("pointerleave", aoSair);
    el.addEventListener("pointerdown", aoTocar); el.addEventListener("pointerup", aoSoltar); el.addEventListener("pointercancel", aoSoltar);
    el.addEventListener("focusin", focoDentro); el.addEventListener("focusout", focoFora);
    window.addEventListener("resize", normalizar);
    raf = requestAnimationFrame(quadro);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); mo.disconnect();
      el.removeEventListener("scroll", aoRolarPista);
      el.removeEventListener("pointerover", aoPassar); el.removeEventListener("pointerleave", aoSair);
      el.removeEventListener("pointerdown", aoTocar); el.removeEventListener("pointerup", aoSoltar); el.removeEventListener("pointercancel", aoSoltar);
      el.removeEventListener("focusin", focoDentro); el.removeEventListener("focusout", focoFora);
      window.removeEventListener("resize", normalizar);
    };
  }, [sentido, itens.length]);

  return (
    <section className="carrossel" aria-label={`Produtos — ${fileira.nome}`}>
      <div className="carrossel__topo">
        <div className="carrossel__titulo">
          <h3>{fileira.nome}</h3>
          {fileira.foto && <img className="carrossel__icone" src={fileira.foto} alt="" width={104} height={104} loading="lazy" />}
        </div>
        <Link className="carrossel__ver-todos" href={`/produtos?categoria=${fileira.slug}`}>Ver todos<span className="sr-only"> — {fileira.nome}</span> <Icone nome="seta" /></Link>
      </div>
      <div className="carrossel__pista" ref={pista}>
        <ul className="carrossel__lista" ref={lista}>
          {Array.from({ length: copias * 2 }, (_, c) => itens.map((p) => (
            c === 0
              ? <CartaoProduto key={`${c}-${p.id}`} p={p} semAnimacao />
              : <CartaoProduto key={`${c}-${p.id}`} p={p} semAnimacao inerte />
          )))}
        </ul>
      </div>
    </section>
  );
}

export function CarrosselProdutos({ fileiras, titulo }: { fileiras: FileiraProdutos[]; titulo: string }) {
  const [rodando, setRodando] = useState(true);
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplicar = () => { setReduzido(mq.matches); if (mq.matches) setRodando(false); };
    aplicar(); mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);
  const ativas = fileiras.filter((f) => f.itens.length);
  const cabecalho = <div><p className="eyebrow">Catálogo</p><h2 id="titulo-destaques">{titulo}</h2></div>;
  if (!ativas.length) return <>{cabecalho}<p className="texto-suave">Em breve, nossos produtos estarão disponíveis aqui.</p></>;
  return (
    <div className="carrossel-bloco">
      <div className="secao__topo secao__topo--carrossel">
        {cabecalho}
        <div className="carrossel-controle">
          {reduzido && !rodando && <span className="texto-suave carrossel-aviso">Seu dispositivo está com “reduzir movimento” ligado.</span>}
          <button type="button" className="botao botao--glass" onClick={() => setRodando((r) => !r)}>
            {rodando ? "Pausar movimento" : "Iniciar movimento"}
          </button>
        </div>
      </div>
      {/* todas as fileiras andam para o mesmo lado (os cartões vão da direita para a esquerda) */}
      {ativas.map((f) => <Fileira key={f.slug} fileira={f} sentido={1} rodando={rodando} />)}
    </div>
  );
}
