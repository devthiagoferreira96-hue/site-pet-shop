import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icone } from "@/components/Icone";
import { BotaoAdicionar } from "@/components/BotaoAdicionar";
import { LinkAnimado } from "@/components/animacao/Animados";
import { Revelar } from "@/components/animacao/Revelar";
import { brl } from "@/components/api-cliente";
import { ESPECIES, obterPublico } from "@/server/services/produtos";
import { EMPRESA } from "@/config/empresa";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await obterPublico((await params).slug);
  return p ? { title: p.nome, description: p.descricao?.slice(0, 150) } : { title: "Produto não encontrado" };
}

export default async function Produto({ params }: Props) {
  const p = await obterPublico((await params).slug);
  if (!p) notFound();
  const receita = p.tipoVenda === "receita";
  return (
    <div className="pagina pagina--estreita">
      <nav className="migalhas" aria-label="Você está em">
        <ol>
          <li><Link href="/">Início</Link></li>
          {p.categoria && <li><Link href={`/produtos?categoria=${p.categoria.slug}`}>{p.categoria.nome}</Link></li>}
          <li><span aria-current="page">{p.nome}</span></li>
        </ol>
      </nav>
      <div className="produto">
        <Revelar className="produto__midia glass">
          {p.imagem?.url ? <img src={p.imagem.url} alt={p.imagem.alt} width={600} height={600} /> : <span className="card__sem-foto">Foto em breve</span>}
        </Revelar>
        <div className="produto__info glass-strong">
          {p.categoria && <span className="selo-cat">{p.categoria.nome}</span>}
          <h1>{p.nome}</h1>
          {receita ? (
            <div className="caixa-receita">
              <strong><Icone nome="receita" /> Venda somente presencial</strong>
              <p>Este medicamento exige receita veterinária. Compre na loja física apresentando a receita: {EMPRESA.endereco}.
                Consulte preço e disponibilidade pelo telefone {EMPRESA.telefone}.</p>
              {EMPRESA.whatsapp && (
                <LinkAnimado className="botao botao--whatsapp mt" target="_blank" rel="noopener noreferrer" icone="mensagem" posicao="antes"
                  href={`https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de saber a disponibilidade de: ${p.nome}`)}`}>
                  Consultar disponibilidade<span className="sr-only"> no WhatsApp (abre em nova aba)</span></LinkAnimado>
              )}
            </div>
          ) : (
            <>
              <p className="produto__preco">{brl(p.precoCentavos)}</p>
              <p className="nota">Preço à vista para compra neste site. Taxa de entrega, quando houver, informada antes da confirmação.</p>
            </>
          )}
          {p.descricao && <p className="texto-suave">{p.descricao}</p>}
          {!receita && (p.disponivelOnline
            ? <><p className="nota">{p.estoqueDisponivel} em estoque</p><BotaoAdicionar produtoId={p.id} nome={p.nome} maximo={p.estoqueDisponivel ?? 1} comQuantidade /></>
            : <p className="aviso-cinza">Produto sem estoque no momento.</p>)}
          <table className="ficha">
            <caption className="sr-only">Ficha técnica</caption>
            <tbody>
              <tr><th scope="row">Indicado para</th><td>{ESPECIES[p.especie as keyof typeof ESPECIES] ?? p.especie}</td></tr>
              {p.marca && <tr><th scope="row">Marca</th><td>{p.marca}</td></tr>}
              {p.pesoVolume && <tr><th scope="row">Peso / volume</th><td>{p.pesoVolume}</td></tr>}
              {p.sku && <tr><th scope="row">Código</th><td>{p.sku}</td></tr>}
              {p.registroMapa && <tr><th scope="row">Registro no MAPA</th><td>{p.registroMapa}</td></tr>}
            </tbody>
          </table>
          {p.usoVeterinario && (
            <p className="caixa-info"><strong>Uso veterinário.</strong> Leia a bula antes de usar e siga a orientação do médico-veterinário quanto à
              dose e à duração. Não substitui a consulta veterinária. Mantenha fora do alcance de crianças e animais.</p>
          )}
        </div>
      </div>
    </div>
  );
}
