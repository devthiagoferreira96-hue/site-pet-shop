"use client";
import Link from "next/link";
import { dataHora, useDados } from "@/components/admin/useAdminApi";

type Resumo = { resumo: Record<string, number>; dadosLegaisPendentes: string[]; ultimaImportacao: { criadoEm: string; atualizados: number } | null };

export default function Painel() {
  const { dados, erro } = useDados<Resumo>("/admin/resumo");
  if (erro) return <p className="alerta alerta--erro" role="alert">{erro}</p>;
  if (!dados) return <p className="carregando" role="status">Carregando…</p>;
  const r = dados.resumo;
  return (
    <>
      <h1>Painel</h1>
      {dados.dadosLegaisPendentes.length > 0 && (
        <p className="alerta alerta--erro" role="alert"><strong>Dados legais pendentes.</strong> O site não pode ser publicado sem eles (Decreto 7.962/2013 e LGPD).
          Preencha no .env: {dados.dadosLegaisPendentes.join(", ")}.</p>
      )}
      {r.antigas > 0 && <p className="alerta alerta--aviso" role="status"><strong>{r.antigas} solicitação(ões) aberta(s) há mais de 10 dias.</strong> Pedidos LGPD
        devem ser respondidos em até 15 dias. <Link href="/admin/solicitacoes">Ver solicitações</Link>.</p>}
      <ul className="cards-resumo">
        <li className="glass-strong"><strong>{r.produtos}</strong>produtos ativos</li>
        <li className="glass-strong"><strong>{r.sem_estoque}</strong>produtos online sem estoque</li>
        <li className="glass-strong"><strong>{r.pedidos_pendentes}</strong>pedidos em andamento</li>
        <li className="glass-strong"><strong>{r.solicitacoes}</strong>solicitações abertas</li>
        <li className="glass-strong"><strong>{r.contatos}</strong>mensagens sem resposta</li>
        <li className="glass-strong"><strong>{r.sem_alt}</strong>imagens sem texto alternativo</li>
        <li className="glass-strong"><strong>{r.med_sem_registro}</strong>medicamentos sem registro MAPA</li>
      </ul>
      <h2>Estoque</h2>
      <p>{dados.ultimaImportacao ? `Última importação do SimplesVet: ${dataHora(dados.ultimaImportacao.criadoEm)} — ${dados.ultimaImportacao.atualizados} produto(s) atualizado(s).`
        : <>O estoque ainda não foi importado. <Link href="/admin/estoque">Importar agora</Link>.</>}</p>
    </>
  );
}
