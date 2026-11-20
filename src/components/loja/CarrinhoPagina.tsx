"use client";
import Link from "next/link";
import { BotaoAnimado, LinkAnimado } from "../animacao/Animados";
import { Revelar } from "../animacao/Revelar";
import { Quantidade } from "../BotaoAdicionar";
import { useCarrinho } from "../Carrinho";
import { brl } from "../api-cliente";
import { useCotacao } from "./useCotacao";

export function CarrinhoPagina({ whatsapp }: { whatsapp: string }) {
  const { definir, remover, itens } = useCarrinho();
  const { cotacao, erro, carregando } = useCotacao();

  if (carregando) return <p className="pagina carregando" role="status">Carregando carrinho…</p>;
  if (!itens.length || !cotacao?.itens.length)
    return (
      <div className="vazio glass">
        <h1>Seu carrinho está vazio</h1>
        {cotacao?.recusados.length ? <p className="nota mt">Alguns itens saíram do carrinho porque não estão mais disponíveis online.</p> : null}
        <Link className="botao botao--hero" href="/produtos">Ver produtos</Link>
      </div>
    );

  // Mensagem do WhatsApp com os preços que o SERVIDOR calculou
  const texto = "Olá! Quero fazer este pedido:\n" +
    cotacao.itens.map((i) => `• ${i.quantidade}x ${i.nome} — ${brl(i.totalCentavos)}`).join("\n") +
    `\n\nSubtotal: ${brl(cotacao.subtotalCentavos)}\n(Valores e disponibilidade sujeitos à confirmação da loja.)`;

  return (
    <div className="pagina pagina--estreita layout-carrinho">
      <section className="painel glass-strong" aria-labelledby="t-carrinho">
        <h1 id="t-carrinho">Carrinho</h1>
        {erro && <p className="alerta alerta--erro" role="alert">{erro}</p>}
        {cotacao.recusados.length > 0 && (
          <div className="alerta alerta--aviso" role="status"><ul>{cotacao.recusados.map((r) => <li key={r.produtoId}>{r.motivo}</li>)}</ul></div>
        )}
        <ul className="itens">
          {cotacao.itens.map((i) => (
            <Revelar como="li" className="item" key={i.produtoId}>
              <div className="item__foto">{i.imagemUrl ? <img src={i.imagemUrl} alt="" width={64} height={64} /> : <span className="card__sem-foto" />}</div>
              <div className="item__info">
                <Link href={`/produtos/${i.slug}`}>{i.nome}</Link>
                <p className="nota">{brl(i.precoUnitCentavos)} cada · total {brl(i.totalCentavos)}</p>
              </div>
              <Quantidade id={`qtd-${i.produtoId}`} rotulo={`Quantidade de ${i.nome}`} valor={i.quantidade} min={1} max={i.estoqueDisponivel}
                onChange={(n) => definir(i.produtoId, n)} />
              <BotaoAnimado type="button" className="btn-remover" onClick={() => remover(i.produtoId)} icone="lixeira" tamanho={22}><span className="sr-only">Remover {i.nome}</span></BotaoAnimado>
            </Revelar>
          ))}
        </ul>
        <div className="acoes-linha"><Link className="botao botao--glass" href="/produtos">Continuar comprando</Link></div>
      </section>
      <aside className="painel glass-strong" aria-labelledby="t-total">
        <h2 id="t-total" className="total-label">Subtotal</h2>
        <p className="total-valor">{brl(cotacao.subtotalCentavos)}</p>
        <p className="nota">A taxa de entrega, se você escolher entrega, aparece antes da confirmação.</p>
        <div className="resumo-acoes">
          <LinkAnimado className="botao botao--hero botao--grande botao--largo" href="/checkout" icone="cartao" posicao="antes">Finalizar pedido</LinkAnimado>
          {whatsapp && (
            <>
              <LinkAnimado className="botao botao--whatsapp botao--grande botao--largo" target="_blank" rel="noopener noreferrer" icone="mensagem" posicao="antes"
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`}>
                Pedir pelo WhatsApp<span className="sr-only"> (abre em nova aba)</span></LinkAnimado>
              <p className="nota">No WhatsApp, a conversa acontece no aplicativo da Meta, com a política de privacidade dele. A loja confirma valores e
                disponibilidade antes do pagamento. Seus direitos de consumidor são os mesmos.</p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
