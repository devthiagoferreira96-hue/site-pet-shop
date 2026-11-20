"use client";
import Link from "next/link";
import { useState } from "react";
import { dataHora, useDados } from "@/components/admin/useAdminApi";
import { brl } from "@/components/api-cliente";
import { STATUS_PEDIDO } from "@/domain/regras";

type Linha = { id: number; codigo: string; status: keyof typeof STATUS_PEDIDO; canal: string; nome: string; modalidade: string; totalCentavos: number; criadoEm: string };

export default function Pedidos() {
  const [status, setStatus] = useState("");
  const { dados, erro } = useDados<Linha[]>(`/admin/pedidos${status ? `?status=${encodeURIComponent(status)}` : ""}`);
  return (
    <>
      <h1>Pedidos</h1>
      <div className="campo">
        <label htmlFor="status">Filtrar por situação</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todas</option>{Object.entries(STATUS_PEDIDO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {erro && <p className="alerta alerta--erro" role="alert">{erro}</p>}
      <div className="tabela-wrap glass-strong">
        <table className="tabela">
          <caption className="sr-only">Pedidos</caption>
          <thead><tr><th scope="col">Pedido</th><th scope="col">Data</th><th scope="col">Cliente</th><th scope="col">Canal</th><th scope="col">Recebimento</th><th scope="col" className="num">Total</th><th scope="col">Situação</th></tr></thead>
          <tbody>
            {!dados ? <tr><td colSpan={7}>Carregando…</td></tr> : !dados.length ? <tr><td colSpan={7}>Nenhum pedido.</td></tr> : dados.map((p) => (
              <tr key={p.id}><td><Link href={`/admin/pedidos/${p.id}`}>{p.codigo}</Link></td><td>{dataHora(p.criadoEm)}</td><td>{p.nome}</td><td>{p.canal}</td>
                <td>{p.modalidade === "entrega" ? "Entrega" : "Retirada"}</td><td className="num">{brl(p.totalCentavos)}</td><td>{STATUS_PEDIDO[p.status]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
