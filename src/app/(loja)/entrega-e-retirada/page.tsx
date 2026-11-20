import type { Metadata } from "next";
import { EMPRESA, ENTREGA } from "@/config/empresa";
import { brl } from "@/components/api-cliente";
import { TextoLegal } from "@/components/legal/TextoLegal";

export const metadata: Metadata = { title: "Entrega e Retirada" };

export default function Entrega() {
  return (
    <TextoLegal titulo="Entrega e Retirada">
      <h2>Retirada na loja</h2>
<ul>
  <li>Endereço: {EMPRESA.endereco}. Horário: {EMPRESA.horario}.</li>
  <li>Aguarde o aviso de “pronto para retirada”, enviado por e-mail após a confirmação do pagamento.</li>
  <li>Apresente o número do pedido e um documento com foto. Outra pessoa pode retirar se você nos informar o nome dela pelo e-mail do pedido.</li>
  <li>O pedido fica reservado por 7 dias após o aviso. Depois disso entraremos em contato; se não for possível retirar, você poderá cancelar com reembolso integral.</li>
</ul>

<h2>Entrega</h2>
{ENTREGA.ativa ? (<>
<ul>
  <li>Área atendida: {ENTREGA.area}.</li>
  <li>Taxa: {brl(ENTREGA.taxaCentavos)}, informada antes da confirmação do pedido.</li>
  <li>Prazo: {ENTREGA.prazo}.</li>
  <li>Confira o produto no recebimento. Se houver avaria ou divergência, recuse ou nos avise imediatamente.</li>
</ul>
</>) : (<>
<p>No momento oferecemos apenas a retirada na loja.</p>
</>)}
    </TextoLegal>
  );
}
