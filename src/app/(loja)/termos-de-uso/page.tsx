import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA } from "@/config/empresa";
import { TextoLegal } from "@/components/legal/TextoLegal";

export const metadata: Metadata = { title: "Termos de Uso e Condições de Venda" };

export default function Termos() {
  return (
    <TextoLegal titulo="Termos de Uso e Condições de Venda">
      <p>Estes Termos regulam o uso do site e as compras feitas nele. Eles seguem o Código de Defesa do Consumidor (Lei nº 8.078/1990 – CDC)
   e o Decreto nº 7.962/2013 (comércio eletrônico). Nenhuma cláusula destes Termos afasta direitos garantidos por lei ao consumidor.</p>

<h2>1. Quem vende</h2>
<p><strong>{EMPRESA.razaoSocial}</strong> (nome fantasia {EMPRESA.nomeFantasia}), CNPJ {EMPRESA.cnpj},
   endereço {EMPRESA.endereco}, e-mail <a href={`mailto:${EMPRESA.emailAtendimento}`}>{EMPRESA.emailAtendimento}</a>,
   telefone {EMPRESA.telefone}. Estabelecimento registrado no Ministério da Agricultura e Pecuária (MAPA) sob nº
   {EMPRESA.registroMapa}, com responsabilidade técnica de {EMPRESA.rtNome} ({EMPRESA.rtCrmv}).</p>

<h2>2. Quem pode comprar</h2>
<p>Pessoas maiores de 18 anos e capazes. Não é preciso criar conta: os dados são pedidos apenas no momento da compra.</p>

<h2>3. Produtos, preços e disponibilidade</h2>
<ul>
  <li>Os preços estão em reais e valem para compras neste site. O valor da entrega, quando houver, aparece antes da confirmação do pedido.</li>
  <li>As fotos mostram o produto ou, quando indicado, uma ilustração. Características essenciais (peso, volume, indicação) estão na página de cada produto.</li>
  <li>O estoque do site é atualizado a partir do sistema da loja física. Se, após o pedido, um item não estiver disponível, avisaremos você,
      que poderá escolher entre aguardar, trocar por outro produto equivalente ou receber de volta o valor pago, integralmente.</li>
  <li>Se houver um erro evidente no preço ou na descrição, entraremos em contato antes de qualquer cobrança e você poderá escolher entre
      manter a compra pelas condições corretas ou cancelá-la, com devolução integral de qualquer valor pago.</li>
</ul>

<h2>4. Medicamentos veterinários</h2>
<ul>
  <li>Pelo site vendemos apenas medicamentos veterinários de venda livre, regularizados no MAPA.</li>
  <li>Medicamentos que exigem receita aparecem apenas para consulta e são vendidos somente na loja física, mediante apresentação da receita
      do médico-veterinário, que é avaliada no balcão.</li>
  <li>Produtos sujeitos a controle especial não são exibidos nem vendidos pelo site.</li>
  <li>As informações do site não substituem a consulta com médico-veterinário. Leia sempre a bula.
      Saiba mais em <Link href="/medicamentos-veterinarios">Medicamentos veterinários</Link>.</li>
</ul>

<h2>5. Como funciona o pedido</h2>
<ol>
  <li>Você escolhe os produtos, informa seus dados e a forma de recebimento.</li>
  <li>Antes de confirmar, mostramos um resumo com itens, valores, forma de recebimento e seus direitos.</li>
  <li>Após a confirmação, você vê o número do pedido na tela e recebe a confirmação por e-mail.</li>
  <li>Enviamos as instruções de pagamento. Os itens ficam reservados por até 2 dias úteis; sem pagamento nesse prazo, o pedido pode ser cancelado sem custo para você.</li>
  <li>Com o pagamento confirmado, o pedido é separado e você é avisado quando estiver pronto para retirada ou sair para entrega.</li>
</ol>

<h2>6. Retirada e entrega</h2>
<p>As condições estão em <Link href="/entrega-e-retirada">Entrega e Retirada</Link>.</p>

<h2>7. Desistência, trocas e reembolso</h2>
<p>Você pode desistir da compra em até 7 dias após o recebimento, com devolução integral dos valores pagos, inclusive da entrega (art. 49 do CDC).
   Produtos com defeito seguem os arts. 18 e 26 do CDC. Veja a <Link href="/trocas-devolucoes-e-reembolso">Política de Trocas, Devoluções e Reembolso</Link>.</p>

<h2>8. Uso do site</h2>
<p>É proibido usar o site para fins ilícitos, tentar acessar áreas restritas, enviar programas maliciosos ou fazer pedidos com dados de terceiros sem autorização.
   Textos, marca, logotipo e layout pertencem à {EMPRESA.razaoSocial} ou são usados com autorização, e não podem ser copiados sem permissão.
   Marcas de produtos pertencem aos respectivos fabricantes.</p>

<h2>9. Privacidade</h2>
<p>O tratamento dos seus dados está descrito na <Link href="/politica-de-privacidade">Política de Privacidade</Link>.</p>

<h2>10. Atendimento</h2>
<p>Fale conosco pelo e-mail <a href={`mailto:${EMPRESA.emailAtendimento}`}>{EMPRESA.emailAtendimento}</a>, telefone {EMPRESA.telefone}
   ({EMPRESA.horario}) ou pelo <Link href="/contato">formulário de contato</Link>.
   Respondemos em até 5 dias. Você também pode procurar o Procon da sua cidade ou a plataforma consumidor.gov.br.</p>

<h2>11. Alterações</h2>
<p>Estes Termos podem ser atualizados. Vale para cada compra a versão aceita no momento do pedido, que fica registrada.</p>

<h2>12. Lei aplicável</h2>
<p>Aplica-se a legislação brasileira. Você pode propor eventual ação no foro do seu domicílio (art. 101, I, do CDC).</p>
    </TextoLegal>
  );
}
