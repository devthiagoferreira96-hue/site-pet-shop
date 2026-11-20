"use client";
/**
 * Checkout em 3 passos: dados -> revisão (resumo exigido pelo Decreto 7.962/2013, art. 4º, I) -> confirmação.
 * Os dados pessoais ficam só na memória desta página e vão direto para a API. Nada é salvo no navegador.
 */
import Link from "next/link";
import { useCallback, useState } from "react";
import { Armadilha, VerificacaoHumana } from "../Humano";
import { api, brl } from "../api-cliente";
import { Campo, AreaTexto, ResumoErros } from "../Campo";
import { useCarrinho } from "../Carrinho";
import { useCotacao } from "./useCotacao";
import { BotaoAnimado } from "../animacao/Animados";
import { IconeAoMontar } from "../animacao/IconeAnimado";

type Props = { termosVersao: string; endereco: string; horario: string; entrega: { ativa: boolean; taxaCentavos: number; area: string; prazo: string } };
type Confirmacao = { codigo: string; email: string; itens: { nome: string; quantidade: number; totalCentavos: number }[]; freteCentavos: number; totalCentavos: number };

const mascararCpf = (cpf: string) => { const d = cpf.replace(/\D/g, ""); return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : ""; };

export function Checkout({ termosVersao, endereco, horario, entrega }: Props) {
  const { itens, limpar } = useCarrinho();
  const [passo, setPasso] = useState<"dados" | "revisao" | "ok">("dados");
  const [f, setF] = useState({ nome: "", email: "", telefone: "", cpf: "", endereco: "", modalidade: "retirada" as "retirada" | "entrega", aceiteTermos: false, marketing: false, site: "" });
  const [humano, setHumano] = useState("");
  const aoToken = useCallback((t: string) => setHumano(t), []);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [msgErro, setMsgErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const { cotacao, carregando } = useCotacao(f.modalidade);
  const set = (k: keyof typeof f, v: string | boolean) => setF((a) => ({ ...a, [k]: v }));

  function validarLocal() {
    const e: Record<string, string> = {};
    if (f.nome.trim().length < 3) e.nome = "Informe seu nome completo.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = "Informe um e-mail válido, por exemplo nome@exemplo.com.";
    if (f.telefone.replace(/\D/g, "").length < 10) e.telefone = "Informe um telefone com DDD, por exemplo (11) 91234-5678.";
    if (f.modalidade === "entrega" && f.endereco.trim().length < 10) e.endereco = "Informe o endereço completo com número, bairro e CEP.";
    if (f.modalidade === "entrega" && f.cpf.replace(/\D/g, "").length !== 11) e.cpf = "Para entrega, o CPF é necessário para emitir a nota fiscal.";
    if (!f.aceiteTermos) e.aceiteTermos = "Para concluir, é preciso aceitar os Termos de Uso e a Política de Trocas.";
    return e;
  }

  async function confirmar() {
    setEnviando(true); setMsgErro("");
    const r = await api<Confirmacao>("/pedidos", { corpo: { ...f, humano, termosVersao, itens } });
    setEnviando(false);
    if (r.dados) { setConfirmacao(r.dados); limpar(); setPasso("ok"); window.scrollTo(0, 0); return; }
    setMsgErro(r.erro?.mensagem ?? "Não foi possível concluir o pedido.");
    if (r.erro?.campos) { setErros(r.erro.campos); setPasso("dados"); }
  }

  if (passo === "ok" && confirmacao)
    return (
      <div className="cartao-form glass-strong">
        <h1 className="titulo-com-icone"><IconeAoMontar nome="sucesso" tamanho={44} className="icone-sucesso" /> Pedido recebido!</h1>
        <p role="status">O número do seu pedido é <strong>{confirmacao.codigo}</strong>. Guarde este número.</p>
        <p>Enviaremos as instruções de pagamento para <strong>{confirmacao.email}</strong>. O pedido só é separado depois da confirmação do pagamento.</p>
        <table className="tabela mt">
          <caption>Itens do pedido</caption>
          <thead><tr><th scope="col">Produto</th><th scope="col">Qtd.</th><th scope="col" className="num">Total</th></tr></thead>
          <tbody>{confirmacao.itens.map((i) => <tr key={i.nome}><td>{i.nome}</td><td>{i.quantidade}</td><td className="num">{brl(i.totalCentavos)}</td></tr>)}</tbody>
          <tfoot>
            <tr><th scope="row" colSpan={2}>Entrega</th><td className="num">{brl(confirmacao.freteCentavos)}</td></tr>
            <tr><th scope="row" colSpan={2}>Total</th><td className="num"><strong>{brl(confirmacao.totalCentavos)}</strong></td></tr>
          </tfoot>
        </table>
        <p className="mt">Precisa desistir ou trocar? Use o <Link href="/arrependimento">formulário de desistência e trocas</Link> com o número do pedido.</p>
        <Link className="botao botao--glass mt" href="/">Voltar para a loja</Link>
      </div>
    );

  if (carregando) return <p className="carregando" role="status">Carregando…</p>;
  if (!cotacao?.itens.length)
    return <div className="vazio glass"><h1>Seu carrinho está vazio</h1><Link className="botao botao--hero" href="/produtos">Ver produtos</Link></div>;

  const passos = (
    <ol className="passos" aria-label="Etapas"><li aria-current={passo === "dados" ? "step" : undefined}>1. Seus dados</li><li aria-hidden="true">›</li>
      <li aria-current={passo === "revisao" ? "step" : undefined}>2. Revisão</li><li aria-hidden="true">›</li><li>3. Confirmação</li></ol>
  );

  if (passo === "revisao")
    return (
      <div>
        {passos}
        <h1>Revise seu pedido antes de confirmar</h1>
        <p>Confira itens, valores e condições. Ao clicar em “Confirmar pedido”, você faz uma compra com obrigação de pagamento.</p>
        {msgErro && <p className="alerta alerta--erro mt" role="alert">{msgErro}</p>}
        <div className="tabela-wrap glass-strong mt">
          <table className="tabela">
            <caption>Itens</caption>
            <thead><tr><th scope="col">Produto</th><th scope="col">Qtd.</th><th scope="col" className="num">Unitário</th><th scope="col" className="num">Total</th></tr></thead>
            <tbody>{cotacao.itens.map((i) => <tr key={i.produtoId}><td>{i.nome}</td><td>{i.quantidade}</td><td className="num">{brl(i.precoUnitCentavos)}</td><td className="num">{brl(i.totalCentavos)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="layout-checkout mt">
          <section className="painel glass-strong" aria-labelledby="t-dados">
            <h2 id="t-dados">Seus dados</h2>
            <p>{f.nome}<br />{f.email}<br />Telefone: {f.telefone}{f.cpf && <><br />CPF: {mascararCpf(f.cpf)}</>}</p>
            <h2 className="mt">Recebimento</h2>
            <p>{f.modalidade === "entrega" ? <>Entrega em: {f.endereco}<br />Prazo: {entrega.prazo}</> : <>Retirada na loja: {endereco}<br />Horário: {horario}</>}</p>
            <p className="mt"><button type="button" className="botao-link" onClick={() => setPasso("dados")}>Alterar dados</button> · <Link href="/carrinho">Alterar itens</Link></p>
          </section>
          <section className="painel glass-strong" aria-labelledby="t-valores">
            <h2 id="t-valores">Valores</h2>
            <dl className="dl-valores">
              <dt>Subtotal</dt><dd>{brl(cotacao.subtotalCentavos)}</dd>
              <dt>Entrega</dt><dd>{cotacao.freteCentavos ? brl(cotacao.freteCentavos) : "Sem custo (retirada)"}</dd>
              <dt className="total">Total</dt><dd className="total">{brl(cotacao.totalCentavos)}</dd>
            </dl>
            <h3>Pagamento</h3>
            <p className="nota">Após a confirmação, você recebe as instruções de pagamento por e-mail. Os itens ficam reservados por até 2 dias úteis;
              sem pagamento, o pedido pode ser cancelado sem custo.</p>
            <h3 className="mt">Seus direitos</h3>
            <p className="nota">Você pode desistir em até 7 dias após o recebimento, com devolução integral dos valores pagos
              (<Link href="/trocas-devolucoes-e-reembolso">Política de Trocas</Link>).</p>
            <VerificacaoHumana onToken={aoToken} />
            <BotaoAnimado type="button" className="botao botao--hero botao--grande botao--largo mt" onClick={confirmar} disabled={enviando} icone="check">
              {enviando ? "Enviando…" : "Confirmar pedido"}</BotaoAnimado>
          </section>
        </div>
      </div>
    );

  return (
    <div className="layout-checkout">
      <section className="cartao-form glass-strong" aria-labelledby="titulo-checkout">
        {passos}
        <h1 id="titulo-checkout">Identificação e recebimento</h1>
        <p>Pedimos apenas os dados necessários para o seu pedido. Veja como usamos seus dados na <Link href="/politica-de-privacidade">Política de Privacidade</Link>.</p>
        <ResumoErros erros={erros} mensagem={msgErro || undefined} />
        <form noValidate onSubmit={(e) => { e.preventDefault(); const er = validarLocal(); setErros(er); setMsgErro(""); if (!Object.keys(er).length) { setPasso("revisao"); window.scrollTo(0, 0); } }}>
          <fieldset>
            <legend>Seus dados</legend>
            <Campo nome="nome" rotulo="Nome completo" erros={erros} value={f.nome} onChange={(e) => set("nome", e.target.value)} autoComplete="name" maxLength={120} />
            <Campo nome="email" rotulo="E-mail" erros={erros} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" maxLength={254}
              dica="Enviaremos a confirmação e as atualizações do pedido para este e-mail." />
            <Campo nome="telefone" rotulo="Telefone com DDD" erros={erros} type="tel" value={f.telefone} onChange={(e) => set("telefone", e.target.value)} autoComplete="tel" maxLength={20}
              dica="Usado somente para avisos sobre este pedido." />
          </fieldset>
          <fieldset aria-describedby={erros.modalidade ? "erro-modalidade" : undefined}>
            <legend>Como você quer receber?</legend>
            <div className="opcoes-radio" id="f-modalidade">
              <label><input type="radio" name="modalidade" checked={f.modalidade === "retirada"} onChange={() => set("modalidade", "retirada")} />
                <span><strong>Retirar na loja</strong> — sem custo. {endereco}.</span></label>
              {entrega.ativa && (
                <label><input type="radio" name="modalidade" checked={f.modalidade === "entrega"} onChange={() => set("modalidade", "entrega")} />
                  <span><strong>Entrega</strong> — taxa de {brl(entrega.taxaCentavos)}. Área: {entrega.area}. Prazo: {entrega.prazo}.</span></label>
              )}
            </div>
            {erros.modalidade && <p className="erro-campo" id="erro-modalidade">{erros.modalidade}</p>}
            <Campo nome="cpf" rotulo="CPF" erros={erros} value={f.cpf} onChange={(e) => set("cpf", e.target.value)} inputMode="numeric" maxLength={14} autoComplete="off"
              obrigatorio={f.modalidade === "entrega"}
              dica={f.modalidade === "entrega" ? "Obrigatório para entrega: necessário para emitir a nota fiscal." : "Opcional na retirada. Preencha só se quiser CPF na nota."} />
            {f.modalidade === "entrega" && (
              <AreaTexto nome="endereco" rotulo="Endereço de entrega (rua, número, complemento, bairro, cidade e CEP)" erros={erros} value={f.endereco}
                onChange={(e) => set("endereco", e.target.value)} maxLength={300} autoComplete="street-address" />
            )}
          </fieldset>
          <Armadilha valor={f.site} onChange={(v) => setF((a) => ({ ...a, site: v }))} />
          <fieldset>
            <legend>Termos e comunicações</legend>
            <div className="campo campo--check">
              <input type="checkbox" id="f-aceiteTermos" checked={f.aceiteTermos} onChange={(e) => set("aceiteTermos", e.target.checked)} aria-required="true"
                aria-invalid={erros.aceiteTermos ? true : undefined} aria-describedby={erros.aceiteTermos ? "erro-aceiteTermos" : undefined} />
              <label htmlFor="f-aceiteTermos">Li e aceito os <Link href="/termos-de-uso" target="_blank">Termos de Uso e Condições de Venda<span className="sr-only"> (abre em nova aba)</span></Link> e a{" "}
                <Link href="/trocas-devolucoes-e-reembolso" target="_blank">Política de Trocas<span className="sr-only"> (abre em nova aba)</span></Link>. <span className="obrigatorio" aria-hidden="true">*</span></label>
            </div>
            {erros.aceiteTermos && <p className="erro-campo" id="erro-aceiteTermos">{erros.aceiteTermos}</p>}
            {/* Consentimento separado, desmarcado por padrão e opcional (LGPD, art. 8º) */}
            <div className="campo campo--check">
              <input type="checkbox" id="f-marketing" checked={f.marketing} onChange={(e) => set("marketing", e.target.checked)} />
              <label htmlFor="f-marketing">Quero receber ofertas e novidades por e-mail (opcional). Posso cancelar quando quiser.</label>
            </div>
          </fieldset>
          <BotaoAnimado type="submit" className="botao botao--hero botao--grande" icone="seta" posicao="depois">Revisar pedido</BotaoAnimado>
        </form>
      </section>
      <aside className="painel glass-strong" aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo">Resumo</h2>
        <ul className="itens">{cotacao.itens.map((i) => <li key={i.produtoId}>{i.quantidade} × {i.nome} — {brl(i.totalCentavos)}</li>)}</ul>
        <dl className="dl-valores"><dt>Subtotal</dt><dd>{brl(cotacao.subtotalCentavos)}</dd></dl>
      </aside>
    </div>
  );
}
