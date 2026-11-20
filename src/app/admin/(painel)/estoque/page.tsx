"use client";
import { useState } from "react";
import { dataHora, enviar, useDados } from "@/components/admin/useAdminApi";
import { BotaoAnimado } from "@/components/animacao/Animados";

type Hist = { id: number; criadoEm: string; origem: string; atualizados: number; naoEncontrados: number };
type Res = { atualizados: number; naoEncontrados: string[]; erros: string[] };

export default function Estoque() {
  const { dados: hist, recarregar } = useDados<Hist[]>("/admin/estoque");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [res, setRes] = useState<Res | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function importar(e: React.FormEvent) {
    e.preventDefault(); if (!arquivo) { setErro("Selecione o arquivo exportado do SimplesVet."); return; }
    setEnviando(true); setErro("");
    const form = new FormData(); form.set("planilha", arquivo);
    const r = await enviar<Res>("/admin/estoque", "POST", undefined, form);
    setEnviando(false);
    if (r.dados) { setRes(r.dados); recarregar(); } else setErro(r.erro?.mensagem ?? "Erro ao importar.");
  }
  return (
    <>
      <h1>Atualizar estoque a partir do SimplesVet</h1>
      <div className="caixa-info">
        <ol>
          <li>No SimplesVet, exporte o relatório de produtos/estoque em Excel (.xlsx) ou CSV.</li>
          <li>A planilha precisa de uma coluna de <strong>código</strong> (Código, SKU ou Código de barras) e uma de <strong>quantidade</strong> (Estoque, Quantidade ou Saldo).</li>
          <li>Envie abaixo. Produtos com o mesmo código têm o estoque atualizado.</li>
        </ol>
        <p className="nota">Itens de pedidos “aguardando pagamento” são descontados automaticamente. Quando um pedido for pago, lance a venda no SimplesVet.</p>
      </div>
      <form onSubmit={importar} className="cartao-form glass-strong">
        {erro && <p className="alerta alerta--erro" role="alert">{erro}</p>}
        <div className="campo">
          <label htmlFor="planilha">Arquivo exportado do SimplesVet (.xlsx ou .csv)</label>
          <input id="planilha" type="file" accept=".xlsx,.csv" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </div>
        <BotaoAnimado type="submit" className="botao botao--hero" disabled={enviando} icone="enviar">{enviando ? "Importando…" : "Importar estoque"}</BotaoAnimado>
      </form>
      {res && (
        <section className="painel glass-strong mt" aria-labelledby="t-res" role="status">
          <h2 id="t-res">Resultado</h2>
          <p>{res.atualizados} produto(s) atualizado(s).</p>
          {res.naoEncontrados.length > 0 && <details><summary>{res.naoEncontrados.length} código(s) sem produto no site</summary><p>{res.naoEncontrados.join(", ")}</p></details>}
          {res.erros.length > 0 && <details><summary>{res.erros.length} linha(s) com problema</summary><ul>{res.erros.map((e) => <li key={e}>{e}</li>)}</ul></details>}
        </section>
      )}
      <h2 className="mt">Últimas importações</h2>
      <div className="tabela-wrap glass-strong">
        <table className="tabela">
          <thead><tr><th scope="col">Data</th><th scope="col">Arquivo</th><th scope="col" className="num">Atualizados</th><th scope="col" className="num">Não encontrados</th></tr></thead>
          <tbody>{hist?.length ? hist.map((h) => <tr key={h.id}><td>{dataHora(h.criadoEm)}</td><td>{h.origem}</td><td className="num">{h.atualizados}</td><td className="num">{h.naoEncontrados}</td></tr>)
            : <tr><td colSpan={4}>Nenhuma importação ainda.</td></tr>}</tbody>
        </table>
      </div>
    </>
  );
}
