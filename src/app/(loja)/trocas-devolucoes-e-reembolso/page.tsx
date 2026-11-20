import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA } from "@/config/empresa";
import { TextoLegal } from "@/components/legal/TextoLegal";

export const metadata: Metadata = { title: "Trocas, Devoluções e Reembolso" };

export default function Reembolso() {
  return (
    <TextoLegal titulo="Trocas, Devoluções e Reembolso">
      <h2>1. Desistência da compra (direito de arrependimento)</h2>
<p>Em compras feitas pelo site, você pode desistir em até <strong>7 dias corridos</strong> contados da data em que recebeu ou retirou o produto,
   sem precisar dizer o motivo (art. 49 do Código de Defesa do Consumidor).</p>
<ul>
  <li><strong>Como pedir:</strong> pelo <Link href="/arrependimento">formulário de desistência</Link>,
      pelo e-mail <a href={`mailto:${EMPRESA.emailAtendimento}`}>{EMPRESA.emailAtendimento}</a> ou na loja. Informe o número do pedido.
      Confirmaremos o recebimento do pedido de desistência imediatamente.</li>
  <li><strong>Devolução do produto:</strong> você pode devolvê-lo na loja ({EMPRESA.endereco}) ou combinar a coleta conosco, sem custo para você.
      Pedimos, se possível, que o produto volte na embalagem original, com acessórios e nota fiscal.</li>
  <li><strong>Reembolso:</strong> devolvemos <strong>todo o valor pago, inclusive a taxa de entrega</strong>, pelo mesmo meio de pagamento usado
      (ou outro de sua escolha), em até 10 dias úteis após recebermos o produto. Em pagamentos com cartão de crédito, pedimos o
      estorno à administradora imediatamente (art. 5º do Decreto 7.962/2013); o prazo para aparecer na fatura depende do banco.</li>
  <li>Por segurança sanitária, rações, petiscos e medicamentos devolvidos são descartados e não voltam à venda. Isso não reduz o seu reembolso.</li>
</ul>

<h2>2. Produto com defeito ou problema</h2>
<p>Você pode reclamar de vícios (defeitos) aparentes ou de fácil constatação em até <strong>30 dias</strong> para produtos não duráveis
   (rações, petiscos, produtos de higiene, medicamentos) e em até <strong>90 dias</strong> para produtos duráveis (acessórios, camas,
   brinquedos), contados do recebimento. No caso de defeito oculto, o prazo começa quando o defeito aparecer (art. 26 do CDC).</p>
<p>Temos até 30 dias para resolver o problema. Se não for resolvido nesse prazo, você escolhe entre: troca por outro produto igual em perfeitas
   condições, devolução imediata do valor pago (corrigido) ou abatimento proporcional do preço (art. 18 do CDC). Para produtos essenciais ou quando
   a troca de partes comprometer o produto, você pode exigir essas alternativas de imediato.</p>
<p>Produtos vencidos, violados, com embalagem danificada na entrega ou diferentes do pedido devem ser comunicados assim que percebidos — faremos a
   troca ou devolução integral.</p>

<h2>3. Pedido não pago ou cancelado por nós</h2>
<p>Se cancelarmos o pedido por falta de estoque ou por qualquer outro motivo, devolvemos integralmente o que tiver sido pago.</p>

<h2>4. Compras feitas na loja física</h2>
<p>O direito de arrependimento de 7 dias vale para compras feitas fora do estabelecimento, como pelo site. Compras feitas na loja seguem a
   garantia legal contra defeitos (item 2) e a política de trocas da loja física, informada no balcão.</p>

<h2>5. Dúvidas</h2>
<p>Fale conosco pelo <Link href="/contato">formulário de contato</Link> ou pelo telefone {EMPRESA.telefone}.</p>
    </TextoLegal>
  );
}
