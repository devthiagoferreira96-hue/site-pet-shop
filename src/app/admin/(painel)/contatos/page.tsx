"use client";
import { dataHora, enviar, useDados } from "@/components/admin/useAdminApi";

type C = { id: number; nome: string; email: string; assunto: string; mensagem: string; respondido: boolean; criadoEm: string };

export default function Contatos() {
  const { dados, recarregar } = useDados<C[]>("/admin/contatos");
  return (
    <>
      <h1>Mensagens do “Fale conosco”</h1>
      <p className="dica">Mensagens são apagadas automaticamente após o prazo de retenção (npm run limpar-dados).</p>
      {!dados ? <p className="carregando" role="status">Carregando…</p> : !dados.length ? <p>Nenhuma mensagem.</p> : dados.map((c) => (
        <article className="painel glass-strong mt" key={c.id}>
          <h2>{c.assunto}</h2>
          <p className="nota">{c.nome} · <a href={`mailto:${c.email}`}>{c.email}</a> · {dataHora(c.criadoEm)} · {c.respondido ? "Respondida" : "Sem resposta"}</p>
          <p className="mt">{c.mensagem}</p>
          {!c.respondido && <button type="button" className="botao botao--glass mt" onClick={async () => { await enviar(`/admin/contatos/${c.id}`, "PATCH"); recarregar(); }}>Marcar como respondida</button>}
        </article>
      ))}
    </>
  );
}
