"use client";
/**
 * Menu principal com uma linha que desliza até a opção sob o mouse (ou com o foco do teclado) e, quando o mouse sai,
 * volta para a opção da página atual. Com "reduzir movimento" a linha apenas aparece no lugar, sem deslizar.
 * No hover/foco, cada item também ganha uma figurinha (FigurinhaMenu) que "pula" para fora à esquerda do texto e
 * muda a cor do rótulo; como ela abre espaço no item, a linha é remedida durante a animação para acompanhar o texto.
 */
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FigurinhaMenu, estiloItemMenu, preCarregarFigurinhas } from "./FigurinhaMenu";

type Item = { chave: "inicio" | "loja" | "cao" | "gato" | "sobre" | "contato"; href: string; rotulo: string };
export const LINKS: Item[] = [
  { chave: "inicio", href: "/", rotulo: "Início" },
  { chave: "loja", href: "/produtos", rotulo: "Loja" },
  { chave: "cao", href: "/produtos?especie=cachorro", rotulo: "Cão" },
  { chave: "gato", href: "/produtos?especie=gato", rotulo: "Gato" },
  { chave: "sobre", href: "/quem-somos", rotulo: "Sobre" },
  { chave: "contato", href: "/contato", rotulo: "Contato" },
];

function estaAtivo(l: Item, caminho: string, especie: string | null) {
  const pet = especie === "cachorro" || especie === "gato";
  if (l.chave === "inicio") return caminho === "/";
  if (l.chave === "loja") return caminho.startsWith("/produtos") && !(caminho === "/produtos" && pet);
  if (l.chave === "cao") return caminho === "/produtos" && especie === "cachorro";
  if (l.chave === "gato") return caminho === "/produtos" && especie === "gato";
  return caminho.startsWith(l.href);
}

export function MenuPrincipal() {
  const caminho = usePathname();
  const especie = useSearchParams()?.get("especie") ?? null;
  const ativoIdx = LINKS.findIndex((l) => estaAtivo(l, caminho, especie));
  const [alvo, setAlvo] = useState<number | null>(null);
  const [pronto, setPronto] = useState(false);
  const [pos, setPos] = useState<{ x: number; w: number } | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const textos = useRef<(HTMLSpanElement | null)[]>([]);
  const indice = alvo ?? ativoIdx;

  const medir = useCallback(() => {
    const t = indice >= 0 ? textos.current[indice] : null, c = caixa.current;
    if (!t || !c) { setPos(null); return; }
    const a = t.getBoundingClientRect(), b = c.getBoundingClientRect();
    setPos({ x: a.left - b.left, w: a.width });
  }, [indice]);

  useEffect(() => { medir(); }, [medir, caminho, especie]);
  useEffect(() => { preCarregarFigurinhas(); }, []); // pré-carrega as animações (aparecem no 1º hover sem atraso)
  // a figurinha abre/fecha espaço no item (~0,4 s): acompanha o texto quadro a quadro até a largura assentar.
  // Depende também de `alvo`: ao tirar o mouse do item da página atual o `indice` não muda (continua o mesmo item),
  // mas a figurinha fecha e o texto volta para a esquerda — sem remedir, a linha ficava parada na posição "aberta".
  useEffect(() => {
    let id = 0; const fim = performance.now() + 700;
    const passo = () => { medir(); if (performance.now() < fim) id = requestAnimationFrame(passo); };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [medir, alvo]);
  useEffect(() => {
    window.addEventListener("resize", medir);
    document.fonts?.ready.then(medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir]);
  useEffect(() => { const id = requestAnimationFrame(() => setPronto(true)); return () => cancelAnimationFrame(id); }, []); // sem animar na 1ª pintura

  return (
    <div className="topo__navcaixa" ref={caixa} onPointerLeave={() => setAlvo(null)}>
      <ul className="topo__nav">
        {LINKS.map((l, i) => (
          <li key={l.chave} onPointerEnter={() => setAlvo(i)}>
            <Link href={l.href} style={estiloItemMenu(l.chave)} aria-current={i === ativoIdx ? "page" : undefined} onFocus={() => setAlvo(i)} onBlur={() => setAlvo(null)}>
              <FigurinhaMenu chave={l.chave} ativa={i === alvo} />
              <span ref={(el) => { textos.current[i] = el; }}>{l.rotulo}</span>
            </Link>
          </li>
        ))}
      </ul>
      <span aria-hidden="true" className={`topo__linha${pronto ? " topo__linha--anim" : ""}`}
        style={pos ? { transform: `translateX(${pos.x}px)`, width: pos.w, opacity: 1 } : { opacity: 0 }} />
    </div>
  );
}

/** Menu do celular (chips) — mesma lógica de página atual. */
export function MenuMovel() {
  const caminho = usePathname();
  const especie = useSearchParams()?.get("especie") ?? null;
  return <ul>{LINKS.map((l) => <li key={l.chave}><Link className="chip glass" href={l.href} aria-current={estaAtivo(l, caminho, especie) ? "true" : undefined}>{l.rotulo}</Link></li>)}</ul>;
}

/** Versão sem destaque, usada enquanto o menu carrega (Suspense). */
export function MenuEstatico({ movel = false }: { movel?: boolean }) {
  return movel
    ? <ul>{LINKS.map((l) => <li key={l.chave}><Link className="chip glass" href={l.href}>{l.rotulo}</Link></li>)}</ul>
    : <div className="topo__navcaixa"><ul className="topo__nav">{LINKS.map((l) => <li key={l.chave}><Link href={l.href} style={estiloItemMenu(l.chave)}><FigurinhaMenu chave={l.chave} /><span>{l.rotulo}</span></Link></li>)}</ul></div>;
}
