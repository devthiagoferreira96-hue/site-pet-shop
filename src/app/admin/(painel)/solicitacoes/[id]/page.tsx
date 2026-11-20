"use client";
import { use, useEffect, useState } from "react";
import { dataHora, enviar, useDados } from "@/components/admin/useAdminApi";
import { TIPOS_SOLICITACAO } from "@/domain/validacao";
import { STATUS_PEDIDO } from "@/domain/regras";

type S = { id: number; protocolo: string; tipo: keyof typeof TIPOS_SOLICITACAO; nome: string; email: string; codigoPedido: string | null; detalhes: string | null;
  status: "aberta" | "em_andamento" | "concluida"; resposta: string | null; criadoEm: string;
  pedidosTitular: { codigo: string; status: keyof typeof STATUS_PEDIDO; criadoEm: string; anonimizado: boolean }[] };

export default function Solicitacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { dados: s, recarregar } = useDados<S>(`/admin/solicitacoes/${id}`);
  const [status, setStatus] = useState<S["status"]>("aberta");
  const [resposta, setResposta] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { if (s) { setStatus(s.status); setResposta(s.resposta ?? ""); } }, [s]);
  if (!s) return <p className="carregando" role="status">Carregando…</p>;
  const lgpd = s.tipo.startsWith("lgpd_");
  return (
    <>
      <h1>Solicitação {s.protocolo}</h1>
      {msg && <p className="alerta alerta--sucesso" role="status">{msg}</p>}
      <div className="layout-checkout">
        <section className="painel glass-strong">
          <p><strong>Tipo:</strong> {TIPOS_SOLICITACAO[s.tipo]}<br /><strong>Nome:</strong> {s.nome}<br /><strong>E-mail:</strong> <a href={`mailto:${s.email}`}>{s.email}</a><br />
            {s.codigoPedido && <><strong>Pedido:</strong> {s.codigoPedido}<br /></>}<strong>Recebida em:</strong> {dataHora(s.criadoEm)}</p>
          {s.detalhes && <p className="mt"><strong>Detalhes:</strong><br />{s.detalhes}</p>}
          {lgpd && (
            <>
              <p className="caixa-aviso mt"><strong>Antes de atender:</strong> confirme a identidade respondendo para o e-mail informado (só ele recebe os dados). Nunca envie dados pessoais para outro endereço.</p>
              <h2 className="mt">Pedidos deste e-mail</h2>
              <ul>{s.pedidosTitular.length ? s.pedidosTitular.map((p) => <li key={p.codigo}>{p.codigo} — {STATUS_PEDIDO[p.status]} — {dataHora(p.criadoEm)}{p.anonimizado ? " (anonimizado)" : ""}</li>) : <li>Nenhum pedido encontrado.</li>}</ul>
              {s.tipo === "lgpd_eliminacao" && (
                <button type="button" className="botao botao--glass mt" onClick={async () => {
                  const r = await enviar<{ mensagem: string }>("/admin/titulares/anonimizar", "POST", { email: s.email });
                  setMsg(r.dados?.mensagem ?? r.erro?.mensagem ?? ""); recarregar();
                }}>Anonimizar pedidos concluídos e apagar mensagens deste e-mail</button>
              )}
            </>
          )}
        </section>
        <section className="painel glass-strong">
          <form onSubmit={async (e) => { e.preventDefault(); const r = await enviar(`/admin/solicitacoes/${id}`, "PATCH", { status, resposta }); setMsg(r.dados ? "Solicitação atualizada." : (r.erro?.mensagem ?? "Erro.")); recarregar(); }}>
            <div className="campo">
              <label htmlFor="st">Situação</label>
              <select id="st" value={status} onChange={(e) => setStatus(e.target.value as S["status"])}>
                <option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="resp">Anotação interna / resumo da resposta enviada</label>
              <textarea id="resp" maxLength={3000} value={resposta} onChange={(e) => setResposta(e.target.value)} />
            </div>
            <button type="submit" className="botao botao--hero">Salvar</button>
          </form>
        </section>
      </div>
    </>
  );
}
