import type { Metadata } from "next";
import { FormSolicitacao } from "@/components/loja/Formularios";
import { TIPOS_SOLICITACAO } from "@/domain/validacao";
import { EMPRESA } from "@/config/empresa";

export const metadata: Metadata = { title: "Seus dados pessoais (LGPD)" };
const tipos = Object.fromEntries(Object.entries(TIPOS_SOLICITACAO).filter(([k]) => k.startsWith("lgpd_")));

export default function MeusDados() {
  return (
    <div className="cartao-form glass-strong">
      <h1>Solicitação sobre seus dados pessoais</h1>
      <p>Pela LGPD (Lei 13.709/2018, art. 18), você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização ou eliminação,
        portabilidade, informação sobre compartilhamento e revogação de consentimento. O pedido é gratuito.</p>
      <p>Encarregado pelo tratamento de dados: {EMPRESA.encarregadoNome} — <a href={`mailto:${EMPRESA.encarregadoEmail}`}>{EMPRESA.encarregadoEmail}</a>.
        Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
      <p className="dica">Dados de pedidos com nota fiscal precisam ser guardados pelo prazo da legislação fiscal; nesses casos explicaremos o que pode ser eliminado.</p>
      <FormSolicitacao tipos={tipos} />
    </div>
  );
}
