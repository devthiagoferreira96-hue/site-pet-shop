"use client";
import Link from "next/link";
import { dataHora, useDados } from "@/components/admin/useAdminApi";
import { TIPOS_SOLICITACAO } from "@/domain/validacao";

type S = { id: number; protocolo: string; tipo: keyof typeof TIPOS_SOLICITACAO; nome: string; status: string; criadoEm: string };
const ROTULO_STATUS: Record<string, string> = { aberta: "Aberta", em_andamento: "Em andamento", concluida: "Concluída" };

export default function Solicitacoes() {
  const { dados, erro } = useDados<S[]>("/admin/solicitacoes");
  return (
    <>
      <h1>Solicitações de clientes</h1>
      <p>Prazos: pedidos sobre dados pessoais (LGPD) — até 15 dias. Desistência (CDC, art. 49) — reembolso integral, inclusive frete.</p>
      {erro && <p className="alerta alerta--erro" role="alert">{erro}</p>}
      <div className="tabela-wrap glass-strong mt">
        <table className="tabela">
          <thead><tr><th scope="col">Protocolo</th><th scope="col">Data</th><th scope="col">Tipo</th><th scope="col">Nome</th><th scope="col">Situação</th></tr></thead>
          <tbody>
            {!dados ? <tr><td colSpan={5}>Carregando…</td></tr> : !dados.length ? <tr><td colSpan={5}>Nenhuma solicitação.</td></tr> : dados.map((s) => (
              <tr key={s.id}><td><Link href={`/admin/solicitacoes/${s.id}`}>{s.protocolo}</Link></td><td>{dataHora(s.criadoEm)}</td>
                <td>{TIPOS_SOLICITACAO[s.tipo] ?? s.tipo}</td><td>{s.nome}</td><td>{ROTULO_STATUS[s.status] ?? s.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
