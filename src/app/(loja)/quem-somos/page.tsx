import type { Metadata } from "next";
import { EMPRESA } from "@/config/empresa";

export const metadata: Metadata = { title: "Sobre" };

export default function QuemSomos() {
  return (
    <div className="sobre">
      <img className="sobre__logo glass" src="/img/logo.png" width={320} height={309}
        alt="Logotipo: uma patinha branca sobre fundo verde-petróleo." />
      <div className="texto-legal glass-strong sobre__texto">
        <h1>Sobre o Pet Shop</h1>
        {/* PREENCHER com a história real da loja. Não invente prêmios, números de clientes ou tempo de mercado. */}
        <p className="texto-suave">Somos um pet shop que oferece rações, acessórios e medicações para cães, gatos e outros pets.
          Medicamentos que exigem receita são vendidos apenas na loja física, mediante apresentação da receita veterinária.</p>
        <h2>Dados da empresa</h2>
        <dl>
          <dt>Razão social</dt><dd>{EMPRESA.razaoSocial}</dd>
          <dt>CNPJ</dt><dd>{EMPRESA.cnpj}</dd>
          <dt>Endereço</dt><dd>{EMPRESA.endereco}</dd>
          <dt>Telefone</dt><dd>{EMPRESA.telefone}</dd>
          <dt>E-mail</dt><dd><a href={`mailto:${EMPRESA.emailAtendimento}`}>{EMPRESA.emailAtendimento}</a></dd>
          <dt>Horário</dt><dd>{EMPRESA.horario}</dd>
          <dt>Responsável técnico</dt><dd>{EMPRESA.rtNome} — {EMPRESA.rtCrmv}</dd>
          <dt>Registro no MAPA</dt><dd>{EMPRESA.registroMapa}</dd>
        </dl>
      </div>
    </div>
  );
}
