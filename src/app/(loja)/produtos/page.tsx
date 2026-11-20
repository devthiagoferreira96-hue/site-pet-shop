import type { Metadata } from "next";
import Link from "next/link";
import { Icone } from "@/components/Icone";
import { BotaoAnimado } from "@/components/animacao/Animados";
import { CartaoProduto, type ProdutoCartao } from "@/components/CartaoProduto";
import { listarCategorias, listarPublico } from "@/server/services/produtos";

export const metadata: Metadata = { title: "Loja" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ categoria?: string; especie?: string; q?: string; pagina?: string }> };

export default async function Produtos({ searchParams }: Props) {
  const sp = await searchParams;
  const categorias = await listarCategorias();
  const categoria = categorias.some((c) => c.slug === sp.categoria) ? sp.categoria : undefined;
  const especie = sp.especie === "cachorro" || sp.especie === "gato" ? sp.especie : undefined;
  const q = (sp.q ?? "").slice(0, 80);
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const r = await listarPublico({ categoria, especie, q, pagina });
  const atual = categorias.find((c) => c.slug === categoria);
  const link = (o: { categoria?: string; especie?: string; pagina?: number }) => {
    const p = new URLSearchParams();
    if (o.categoria) p.set("categoria", o.categoria);
    if (o.especie) p.set("especie", o.especie);
    if (q) p.set("q", q);
    if (o.pagina && o.pagina > 1) p.set("pagina", String(o.pagina));
    const s = p.toString();
    return `/produtos${s ? `?${s}` : ""}`;
  };

  return (
    <div className="pagina">
      <h1>{[atual?.nome ?? (especie ? "Produtos" : "Loja"), especie === "cachorro" ? "para cães" : especie === "gato" ? "para gatos" : ""].filter(Boolean).join(" ")}</h1>
      <div className="filtros glass">
        <nav aria-label="Categorias">
          <ul className="chips">
            <li><Link className="chip" href={link({ especie })} aria-current={!categoria ? "true" : undefined}>Todos</Link></li>
            {categorias.map((c) => (
              <li key={c.slug}><Link className="chip" href={link({ categoria: c.slug, especie })} aria-current={categoria === c.slug ? "true" : undefined}>
                {c.nome}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Espécie">
          <ul className="chips">
            <li><Link className="chip" href={link({ categoria })} aria-current={!especie ? "true" : undefined}>Todos os pets</Link></li>
            <li><Link className="chip" href={link({ categoria, especie: "cachorro" })} aria-current={especie === "cachorro" ? "true" : undefined}>Cão</Link></li>
            <li><Link className="chip" href={link({ categoria, especie: "gato" })} aria-current={especie === "gato" ? "true" : undefined}>Gato</Link></li>
          </ul>
        </nav>
        <form role="search" method="get" action="/produtos">
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
          {especie && <input type="hidden" name="especie" value={especie} />}
          <label htmlFor="busca-cat" className="sr-only">Buscar produto</label>
          <Icone nome="busca" />
          <input id="busca-cat" name="q" type="search" defaultValue={q} placeholder="Buscar produto..." maxLength={80} />
          <BotaoAnimado type="submit" className="botao botao--hero" icone="busca" tamanho={18}>Buscar</BotaoAnimado>
        </form>
      </div>

      <p className="resultado" role="status">{q ? `Resultados para “${q}”: ` : ""}{r.total} produto(s).</p>

      {categoria === "medicacoes" && (
        <p className="caixa-receita mt">Medicamentos que exigem receita aparecem apenas para consulta e são vendidos somente na loja física, com a receita do
          médico-veterinário. Medicamentos não substituem a consulta veterinária. <Link href="/medicamentos-veterinarios">Saiba mais</Link>.</p>
      )}

      {r.itens.length ? (
        <ul className="grade-produtos lista-produtos">{r.itens.map((p) => <CartaoProduto key={p.id} p={p as ProdutoCartao} />)}</ul>
      ) : <p className="mt texto-suave">Nenhum produto encontrado. <Link href="/produtos">Ver todos os produtos</Link>.</p>}

      {r.paginas > 1 && (
        <nav aria-label="Paginação">
          <ul className="paginacao">
            {Array.from({ length: r.paginas }, (_, i) => i + 1).map((n) => (
              <li key={n}>{n === pagina
                ? <span className="glass-strong" aria-current="page"><span className="sr-only">Página </span>{n}</span>
                : <Link className="glass" href={link({ categoria, especie, pagina: n })}><span className="sr-only">Página </span>{n}</Link>}</li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
