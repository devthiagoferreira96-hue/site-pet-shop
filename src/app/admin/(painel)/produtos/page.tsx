"use client";
import Link from "next/link";
import { useState } from "react";
import { useDados } from "@/components/admin/useAdminApi";
import { brl } from "@/components/api-cliente";
import { LinkAnimado } from "@/components/animacao/Animados";

type Linha = { id: number; nome: string; sku: string | null; categoriaNome: string | null; precoCentavos: number; estoque: number; tipoVenda: string; ativo: boolean };
const VENDA: Record<string, string> = { livre: "Online", receita: "Só loja (receita)", controlado: "Oculto (controlado)" };

export default function Produtos() {
  const [q, setQ] = useState("");
  const [busca, setBusca] = useState("");
  const { dados, erro } = useDados<Linha[]>(`/admin/produtos?q=${encodeURIComponent(busca)}`);
  return (
    <>
      <h1>Produtos e estoque</h1>
      <div className="linha-admin">
        <form role="search" className="filtros glass" onSubmit={(e) => { e.preventDefault(); setBusca(q); }}>
          <label htmlFor="q" className="sr-only">Buscar por nome ou código</label>
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou código" />
          <button className="botao botao--glass" type="submit">Buscar</button>
        </form>
        <LinkAnimado className="botao botao--hero" href="/admin/produtos/novo" icone="mais" posicao="antes">Novo produto</LinkAnimado>
      </div>
      {erro && <p className="alerta alerta--erro" role="alert">{erro}</p>}
      <div className="tabela-wrap glass-strong mt">
        <table className="tabela">
          <caption className="sr-only">Lista de produtos</caption>
          <thead><tr><th scope="col">Produto</th><th scope="col">Código</th><th scope="col">Categoria</th><th scope="col" className="num">Preço</th><th scope="col" className="num">Estoque</th><th scope="col">Venda</th><th scope="col">Situação</th></tr></thead>
          <tbody>
            {!dados ? <tr><td colSpan={7}>Carregando…</td></tr> : dados.length === 0 ? <tr><td colSpan={7}>Nenhum produto.</td></tr> : dados.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/produtos/${p.id}`}>{p.nome}</Link>{p.tipoVenda === "receita" && <span className="selo-mini">Receita</span>}</td>
                <td>{p.sku ?? "—"}</td><td>{p.categoriaNome ?? "—"}</td><td className="num">{brl(p.precoCentavos)}</td>
                <td className={`num ${p.estoque <= 3 ? "estoque-baixo" : ""}`}>{p.estoque}{p.estoque <= 3 && <span className="sr-only"> (estoque baixo)</span>}</td>
                <td>{VENDA[p.tipoVenda]}</td><td>{p.ativo ? "Ativo" : "Oculto"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
