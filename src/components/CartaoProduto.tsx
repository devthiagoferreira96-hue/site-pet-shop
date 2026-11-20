import Link from "next/link";
import { Icone } from "./Icone";
import { BotaoAdicionar } from "./BotaoAdicionar";
import { Revelar } from "./animacao/Revelar";
import { brl } from "./api-cliente";

export type ProdutoCartao = {
  id: number; nome: string; slug: string; tipoVenda: "livre" | "receita"; precoCentavos: number | null;
  disponivelOnline: boolean; categoria: { slug: string; nome: string | null } | null; imagem: { url: string | null; alt: string } | null;
};

export function CartaoProduto({ p, semAnimacao = false, inerte = false }: { p: ProdutoCartao; semAnimacao?: boolean; inerte?: boolean }) {
  const conteudo = (
    <article className="card glass">
      <Link className="card__midia" href={`/produtos/${p.slug}`} tabIndex={-1} aria-hidden="true">
        {p.imagem?.url ? <img src={p.imagem.url} alt="" loading="lazy" width={400} height={400} />
          : <span className="card__sem-foto">Foto em breve</span>}
        {p.categoria?.nome && <span className="chip-cat glass">{p.categoria.nome}</span>}
      </Link>
      <div className="card__corpo">
        <h3><Link className="card__nome" href={`/produtos/${p.slug}`}>{p.nome}</Link></h3>
        {p.tipoVenda === "receita" ? <p className="texto-suave">Consulte o preço na loja</p> : <p className="preco">{brl(p.precoCentavos)}</p>}
        <div className="card__acao">
          {p.tipoVenda === "receita" ? <p className="aviso-receita"><Icone nome="receita" /> Venda somente presencial com receita</p>
            : p.disponivelOnline ? <BotaoAdicionar produtoId={p.id} nome={p.nome} />
            : <p className="aviso-cinza">Sem estoque</p>}
        </div>
      </div>
    </article>
  );
  // semAnimacao: usado no carrossel (sem fade-in); inerte: cópia usada só para o loop visual.
  // A cópia fica escondida de leitor de tela (aria-hidden) e fora da ordem do Tab (o carrossel põe tabindex=-1
  // nos itens focáveis dela), mas NÃO usa `inert`: assim o mouse funciona nela (pausa ao passar por cima).
  if (semAnimacao) return inerte ? <li aria-hidden="true" data-copia="">{conteudo}</li> : <li>{conteudo}</li>;
  return <Revelar como="li">{conteudo}</Revelar>;
}
