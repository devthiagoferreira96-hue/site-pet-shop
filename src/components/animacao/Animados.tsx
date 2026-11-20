"use client";
/** Links e botões com ícone animado no hover/foco — usados por páginas do servidor. */
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconeAnimado, useAnimarIcone } from "./IconeAnimado";
import type { NomeIconeAnimado } from "./icones";

type Posicao = "antes" | "depois";

export function LinkAnimado({ href, icone, posicao = "depois", className, children, tamanho = 20, target, rel }: {
  href: string; icone: NomeIconeAnimado; posicao?: Posicao; className?: string; children: ReactNode; tamanho?: number; target?: string; rel?: string;
}) {
  const { controle, gatilhos } = useAnimarIcone();
  const ic = <IconeAnimado nome={icone} tamanho={tamanho} controle={controle} />;
  const externo = /^https?:/.test(href);
  const conteudo = <>{posicao === "antes" && ic}{children}{posicao === "depois" && ic}</>;
  return externo
    ? <a href={href} className={className} target={target} rel={rel} {...gatilhos}>{conteudo}</a>
    : <Link href={href} className={className} {...gatilhos}>{conteudo}</Link>;
}

export function BotaoAnimado({ icone, posicao = "antes", tamanho = 20, children, ...props }: {
  icone: NomeIconeAnimado; posicao?: Posicao; tamanho?: number; children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { controle, gatilhos } = useAnimarIcone();
  const ic = <IconeAnimado nome={icone} tamanho={tamanho} controle={controle} />;
  return (
    <button {...props} onMouseEnter={gatilhos.onMouseEnter} onMouseLeave={gatilhos.onMouseLeave} onFocus={gatilhos.onFocus} onBlur={gatilhos.onBlur}>
      {posicao === "antes" && ic}{children}{posicao === "depois" && ic}
    </button>
  );
}

/** Card de categoria da home: a seta anima quando o card recebe hover ou foco. */
export function CardCategoria({ href, foto, nome, className }: { href: string; foto?: string | null; nome: string; className: string }) {
  const { controle, gatilhos } = useAnimarIcone();
  return (
    <Link className={className} href={href} {...gatilhos}>
      <span className="categoria__titulo">{foto && <img className="categoria__foto" src={foto} alt="" width={80} height={80} loading="lazy" />}<h2>{nome}</h2></span>
      <IconeAnimado nome="seta" tamanho={24} controle={controle} className="categoria__seta" />
    </Link>
  );
}
