import Link from "next/link";
import { Icone } from "@/components/Icone";
import { CardCategoria, LinkAnimado } from "@/components/animacao/Animados";
import { IconeAoAparecer } from "@/components/animacao/IconeAnimado";
import { Revelar } from "@/components/animacao/Revelar";
import type { ProdutoCartao } from "@/components/CartaoProduto";
import { CarrosselProdutos, type FileiraProdutos } from "@/components/CarrosselProdutos";
import { fotoLocal } from "@/server/fotos";
import { listarCategorias, listarPublico } from "@/server/services/produtos";
import { EMPRESA } from "@/config/empresa";
import { INTERVALO_BANNERS_MS, destaquesVisiveis } from "@/config/destaque";
import { BannersDestaque } from "@/components/BannersDestaque";

export const dynamic = "force-dynamic"; // estoque e preços sempre atuais

export default async function Inicio() {
  const categorias = await listarCategorias();
  // Ordem do carrossel: Acessórios, depois Ração, depois Medicações
  const ORDEM = ["acessorios", "racoes", "medicacoes"];
  const fileiras: FileiraProdutos[] = (await Promise.all(
    ORDEM.map((slug) => categorias.find((c) => c.slug === slug)).filter((c): c is (typeof categorias)[number] => Boolean(c))
      .map(async (c) => ({ slug: c.slug, nome: c.nome, foto: fotoLocal("categorias", c.slug), fundo: null, itens: (await listarPublico({ categoria: c.slug, ordem: "nome", limite: 24 })).itens as ProdutoCartao[] })),
  ));
  return (
    <>
      {/* Capa imersiva: foto de ponta a ponta por baixo do cabeçalho de vidro; texto num painel sólido (docs/DESIGN-SYSTEM.md) */}
      <section className="hero hero--imersivo" aria-labelledby="hero-titulo">
        <figure className="hero__midia">
          <img src="/img/hero-pets.webp" srcSet="/img/hero-pets-800.webp 800w, /img/hero-pets.webp 1600w"
            sizes="100vw" alt="Um cachorro golden retriever e um gato rajado, lado a lado" width={1600} height={907} fetchPriority="high" />
        </figure>
        <div className="hero__interno">
        <div className="hero__conteudo animar-subir">
          <p className="eyebrow">Pet shop · Rações, acessórios e medicações</p>
          <h1 id="hero-titulo">Tudo para o seu <em>melhor amigo</em></h1>
          {/* Sem promessas não comprovadas (ex.: "entrega rápida") */}
          <p className="hero__texto">Escolha pelo site, confirme o pedido e retire na loja{EMPRESA.whatsapp ? ". Dúvidas? Fale com a gente no WhatsApp" : ""}.</p>
          <div className="hero__acoes">
            <LinkAnimado className="botao botao--hero botao--grande" href="/produtos" icone="seta">Ver produtos</LinkAnimado>
            <Link className="botao botao--glass botao--grande" href="/quem-somos">Conheça a loja</Link>
          </div>
          <ul className="hero__fatos" aria-label="Como comprar">
            <li><Icone nome="loja" /> Retirada na loja</li>
            <li><Icone nome="receita" /> Medicações com receita na loja física</li>
          </ul>
        </div>
        </div>
      </section>

      <ul className="categorias" aria-label="Categorias">
        {categorias.map((c, i) => (
          <li key={c.slug}>
            <CardCategoria className={`categoria superficie animar-subir atraso-${i}`} href={`/produtos?categoria=${c.slug}`} foto={fotoLocal("categorias", c.slug)} nome={c.nome} />
          </li>
        ))}
      </ul>

      <BannersDestaque banners={destaquesVisiveis()} intervalo={INTERVALO_BANNERS_MS} />

      <section className="secao" aria-labelledby="titulo-destaques">
        <CarrosselProdutos fileiras={fileiras} titulo="Nossos produtos" />
      </section>

      <section className="faixa" aria-labelledby="titulo-faixa">
        <div className="faixa__cabeca">
          <p className="eyebrow">Como funciona</p>
          <h2 id="titulo-faixa">Comprar com a gente é simples</h2>
        </div>
        <ul className="faixa__grade">
          <Revelar como="li" className="faixa__item"><span className="faixa__icone"><IconeAoAparecer nome="local" /></span><h3>Retire na loja</h3><p>Peça pelo site e retire no endereço da loja após a confirmação.</p></Revelar>
          {EMPRESA.whatsapp
            ? <Revelar como="li" atraso={0.08} className="faixa__item"><span className="faixa__icone"><IconeAoAparecer nome="mensagem" /></span><h3>Atendimento no WhatsApp</h3><p>Tire dúvidas e faça seu pedido.</p></Revelar>
            : <Revelar como="li" atraso={0.08} className="faixa__item"><span className="faixa__icone"><IconeAoAparecer nome="calendario" /></span><h3>Desistência em 7 dias</h3><p>Comprou pelo site? Pode desistir em até 7 dias após receber.</p></Revelar>}
          <Revelar como="li" atraso={0.16} className="faixa__item"><span className="faixa__icone"><IconeAoAparecer nome="coracao" /></span><h3>Medicações com receita</h3><p>Itens com receita são vendidos apenas na loja física.</p></Revelar>
        </ul>
      </section>
    </>
  );
}
