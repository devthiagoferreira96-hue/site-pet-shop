import type { Metadata } from "next";
import Link from "next/link";
import { FormSolicitacao } from "@/components/loja/Formularios";
import { TIPOS_SOLICITACAO } from "@/domain/validacao";

export const metadata: Metadata = { title: "Desistência, troca ou devolução" };
const tipos = { arrependimento: TIPOS_SOLICITACAO.arrependimento, troca: TIPOS_SOLICITACAO.troca };

export default function Arrependimento() {
  return (
    <div className="cartao-form glass-strong">
      <h1>Desistência, troca ou devolução</h1>
      <p><strong>Desistência:</strong> em compras pelo site ou app, você pode desistir em até 7 dias corridos após receber ou retirar o produto,
        sem precisar explicar o motivo (art. 49 do CDC). Devolvemos todo o valor pago, inclusive a taxa de entrega.</p>
      <p><strong>Produto com defeito:</strong> até 30 dias para produtos não duráveis (rações, higiene) e 90 dias para duráveis (acessórios, camas),
        conforme o art. 26 do CDC. Detalhes na <Link href="/trocas-devolucoes-e-reembolso">Política de Trocas, Devoluções e Reembolso</Link>.</p>
      <FormSolicitacao tipos={tipos} />
    </div>
  );
}
