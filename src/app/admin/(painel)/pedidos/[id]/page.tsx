"use client";
import { use, useEffect, useState } from "react";
import { dataHora, enviar, useDados } from "@/components/admin/useAdminApi";
import { brl } from "@/components/api-cliente";
import { STATUS_PEDIDO } from "@/domain/regras";

type Pedido = { id: number; codigo: string; status: keyof typeof STATUS_PEDIDO; canal: string; nome: string; email: string; telefone: string; cpf: string | null;
  modalidade: string; endereco: string | null; subtotalCentavos: number; freteCentavos: number; totalCentavos: number; aceiteTermosVersao: string;
  aceiteEm: string; marketingOptin: boolean; marketingOptinEm: string | null; criadoEm: string;
  itens: { id: number; nomeProduto: string; sku: string | null; quantidade: number; precoUnitCentavos: number }[] };

export default function PedidoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { dados: p, erro, recarregar } = useDados<Pedido>(`/admin/pedidos/${id}`);
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { if (p) setStatus(p.status); }, [p]);
  if (erro) return <p className="alerta alerta--erro" role="alert">{erro}</p>;
  if (!p) return <p className="carregando" role="status">Carregando…</p>;
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const r = await enviar<{ lembrete: string | null }>(`/admin/pedidos/${id}`, "PATCH", { status });
    setMsg(r.dados ? (r.dados.lembrete ?? "Situação atualizada.") : (r.erro?.mensagem ?? "Erro."));
    recarregar();
  }
  return (
    <>
      <h1>Pedido {p.codigo}</h1>
      <p>Situação: <strong>{STATUS_PEDIDO[p.status]}</strong> · Canal: {p.canal} · Criado em {dataHora(p.criadoEm)}</p>
      {msg && <p className="alerta alerta--aviso" role="status">{msg}</p>}
      <div className="layout-checkout">
        <section className="painel glass-strong" aria-labelledby="t-cli">
          <h2 id="t-cli">Cliente</h2>
          <p>{p.nome}<br /><a href={`mailto:${p.email}`}>{p.email}</a><br />Telefone: {p.telefone}{p.cpf && <><br />CPF: {p.cpf} <span className="dica">(mascarado)</span></>}</p>
          <h2 className="mt">Recebimento</h2>
          <p>{p.modalidade === "entrega" ? `Entrega: ${p.endereco}` : "Retirada na loja"}</p>
          <p className="dica mt">Aceitou os Termos versão {p.aceiteTermosVersao} em {dataHora(p.aceiteEm)}. E-mails promocionais:{" "}
            {p.marketingOptin ? `autorizou em ${dataHora(p.marketingOptinEm)}` : "não autorizou"}.</p>
        </section>
        <section className="painel glass-strong" aria-labelledby="t-st">
          <h2 id="t-st">Alterar situação</h2>
          <form onSubmit={salvar}>
            <div className="campo">
              <label htmlFor="st">Nova situação</label>
              <select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>{Object.entries(STATUS_PEDIDO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <button type="submit" className="botao botao--hero">Salvar</button>
          </form>
          <p className="dica mt">Ao marcar “Pagamento confirmado”, lance a venda no SimplesVet. Cancelar um pedido “aguardando pagamento” devolve os itens ao estoque do site.</p>
        </section>
      </div>
      <div className="tabela-wrap glass-strong mt">
        <table className="tabela">
          <caption>Itens</caption>
          <thead><tr><th scope="col">Produto</th><th scope="col">Código</th><th scope="col">Qtd.</th><th scope="col" className="num">Unitário</th><th scope="col" className="num">Total</th></tr></thead>
          <tbody>{p.itens.map((i) => <tr key={i.id}><td>{i.nomeProduto}</td><td>{i.sku ?? "—"}</td><td>{i.quantidade}</td><td className="num">{brl(i.precoUnitCentavos)}</td><td className="num">{brl(i.precoUnitCentavos * i.quantidade)}</td></tr>)}</tbody>
          <tfoot>
            <tr><th scope="row" colSpan={4}>Entrega</th><td className="num">{brl(p.freteCentavos)}</td></tr>
            <tr><th scope="row" colSpan={4}>Total</th><td className="num"><strong>{brl(p.totalCentavos)}</strong></td></tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
