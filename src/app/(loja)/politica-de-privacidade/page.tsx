import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA, RETENCAO, GA4_ID } from "@/config/empresa";
import { TextoLegal } from "@/components/legal/TextoLegal";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PoliticaPrivacidade() {
  return (
    <TextoLegal titulo="Política de Privacidade">
      <p>Esta Política explica, em linguagem simples, quais dados pessoais o site da {EMPRESA.nomeFantasia} coleta, para quê,
   por quanto tempo e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados Pessoais
   (Lei nº 13.709/2018 – LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).</p>

<h2>1. Quem é o responsável pelos seus dados</h2>
<p>O controlador dos dados é <strong>{EMPRESA.razaoSocial}</strong>, CNPJ {EMPRESA.cnpj}, com sede em {EMPRESA.endereco}.</p>
<p>Encarregado pelo tratamento de dados pessoais (art. 41 da LGPD): <strong>{EMPRESA.encarregadoNome}</strong>,
   e-mail <a href={`mailto:${EMPRESA.encarregadoEmail}`}>{EMPRESA.encarregadoEmail}</a>.</p>

<h2>2. Quais dados coletamos, por que e por quanto tempo</h2>
<p>Coletamos apenas o necessário para cada finalidade. Você não precisa criar conta para comprar.</p>
<table>
  <caption className="sr-only">Dados tratados, finalidade, base legal e prazo de guarda</caption>
  <thead><tr><th scope="col">Situação</th><th scope="col">Dados</th><th scope="col">Para quê</th><th scope="col">Base legal (LGPD)</th><th scope="col">Por quanto tempo</th></tr></thead>
  <tbody>
    <tr><td>Pedido no site ou no aplicativo</td><td>Nome, e-mail, telefone</td><td>Processar o pedido, informar pagamento, separação, retirada ou entrega e prestar atendimento</td><td>Execução de contrato (art. 7º, V)</td><td>5 anos após o pedido; depois os dados são anonimizados</td></tr>
    <tr><td>Pedido com entrega</td><td>Endereço</td><td>Entregar o produto</td><td>Execução de contrato (art. 7º, V)</td><td>5 anos após o pedido</td></tr>
    <tr><td>Pedido com entrega (obrigatório) ou retirada (opcional)</td><td>CPF</td><td>Emitir a nota fiscal</td><td>Cumprimento de obrigação legal (art. 7º, II)</td><td>Prazo exigido pela legislação fiscal (em regra, 5 anos)</td></tr>
    <tr><td>Aceite dos Termos</td><td>Data, hora e versão aceita</td><td>Comprovar as condições combinadas</td><td>Exercício regular de direitos (art. 7º, VI)</td><td>5 anos após o pedido</td></tr>
    <tr><td>E-mails de ofertas (só se você marcar a opção)</td><td>Nome e e-mail</td><td>Enviar ofertas e novidades da loja</td><td>Consentimento (art. 7º, I)</td><td>Até você cancelar (link em cada e-mail ou pelo formulário de dados pessoais)</td></tr>
    {EMPRESA.whatsapp && (<><tr><td>Pedido ou dúvida pelo WhatsApp (opcional)</td><td>Seu número, nome de perfil e o conteúdo da conversa</td><td>Atender ao pedido ou à dúvida</td><td>Execução de contrato e procedimentos a pedido do titular (art. 7º, V)</td><td>Conversas apagadas do aparelho da loja após 180 dias, salvo pedido em andamento</td></tr></>)}
    <tr><td>Fale conosco</td><td>Nome, e-mail e a mensagem</td><td>Responder ao seu contato</td><td>Procedimentos a pedido do titular (art. 7º, V)</td><td>{RETENCAO.contatoDias} dias</td></tr>
    <tr><td>Solicitações sobre dados, desistência ou trocas</td><td>Nome, e-mail, nº do pedido e detalhes</td><td>Atender ao pedido e comprovar o atendimento</td><td>Obrigação legal (art. 7º, II) e exercício regular de direitos (art. 7º, VI)</td><td>5 anos após a conclusão</td></tr>
    <tr><td>Navegação</td><td>Endereço IP, data e hora de acesso (registros de acesso)</td><td>Segurança e cumprimento do Marco Civil da Internet</td><td>Obrigação legal (art. 7º, II; art. 15 da Lei 12.965/2014)</td><td>6 meses</td></tr>
    <tr><td>Cookies e armazenamento necessários</td><td>Sua escolha sobre cookies e os produtos do carrinho (sem dados pessoais)</td><td>Fazer o site funcionar e lembrar sua preferência</td><td>Legítimo interesse e execução de contrato</td><td>Veja a <Link href="/politica-de-cookies">Política de Cookies</Link></td></tr>
    {GA4_ID && (<><tr><td>Estatística (só se você aceitar)</td><td>Identificador do navegador e páginas visitadas</td><td>Medir o uso do site de forma agregada</td><td>Consentimento (art. 7º, I)</td><td>Até 14 meses no Google Analytics</td></tr></>)}
  </tbody>
</table>

<h2>3. O que não coletamos</h2>
<ul>
  <li>Não pedimos dados sensíveis (como saúde, religião ou biometria) e não pedimos data de nascimento ou gênero.</li>
  <li>Não guardamos dados de cartão. Quando houver pagamento online, eles são digitados diretamente no ambiente do intermediador de pagamento
      ({EMPRESA.fornecedorPagamento}), que tem política própria.</li>
  <li>Receitas veterinárias não são enviadas pelo site: medicamentos que exigem receita são vendidos apenas na loja física.</li>
  <li>Não vendemos nem alugamos dados pessoais.</li>
</ul>

<h2>4. Com quem compartilhamos</h2>
<p>Somente quando necessário para as finalidades acima, com empresas que tratam os dados em nosso nome e seguindo nossas instruções:</p>
<ul>
  <li>Hospedagem do site: {EMPRESA.fornecedorHospedagem};</li>
  <li>Envio de e-mails: {EMPRESA.fornecedorEmail};</li>
  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <li>Proteção contra robôs nos formulários: Cloudflare Turnstile (Cloudflare, Inc.), que analisa sinais técnicos do navegador para confirmar que o envio foi feito por uma pessoa. Base legal: legítimo interesse (segurança);</li>}
  <li>Pagamentos: {EMPRESA.fornecedorPagamento};</li>
  {EMPRESA.whatsapp && (<><li>WhatsApp (Meta), se você escolher falar ou pedir por lá. O WhatsApp trata os dados conforme a política de privacidade dele;</li></>)}
  <li>Entregas: entregador ou transportadora responsável, apenas nome, telefone e endereço;</li>
  <li>Contabilidade, para obrigações fiscais;</li>
  <li>Autoridades públicas, quando houver obrigação legal ou ordem judicial.</li>
</ul>
<p>Se algum desses fornecedores armazenar dados fora do Brasil, a transferência seguirá o art. 33 da LGPD, com garantias contratuais adequadas.</p>

<h2>5. Seus direitos</h2>
<p>Você pode, gratuitamente e a qualquer momento (art. 18 da LGPD):</p>
<ul>
  <li>confirmar se tratamos seus dados e acessá-los;</li>
  <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
  <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei;</li>
  <li>pedir a portabilidade dos dados;</li>
  <li>pedir a eliminação dos dados tratados com base no seu consentimento;</li>
  <li>saber com quem compartilhamos seus dados;</li>
  <li>saber que pode não consentir e quais as consequências;</li>
  <li>revogar o consentimento;</li>
  <li>opor-se a tratamento feito em desconformidade com a lei.</li>
</ul>
<p>Para exercer seus direitos, use o <Link href="/meus-dados">formulário de solicitação sobre dados pessoais</Link>
   ou escreva ao encarregado. Para sua segurança, podemos confirmar sua identidade antes de atender. Respondemos em até 15 dias.
   Alguns dados precisam ser mantidos por obrigação legal (por exemplo, dados de notas fiscais); nesses casos explicaremos o motivo.
   Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.</p>

<h2>6. Segurança</h2>
<p>Adotamos medidas técnicas e administrativas para proteger seus dados, como conexão criptografada (HTTPS), senhas armazenadas com
   criptografia, dados como CPF, telefone, endereço e e-mail guardados cifrados no banco (AES-256), acesso ao painel restrito a funcionários autorizados, registro das ações administrativas e exclusão periódica de dados
   que não são mais necessários. Em caso de incidente de segurança que possa causar risco ou dano relevante, comunicaremos os titulares
   afetados e a ANPD, conforme o art. 48 da LGPD.</p>

<h2>7. Crianças e adolescentes</h2>
<p>As compras no site devem ser feitas por maiores de 18 anos. Não coletamos intencionalmente dados de crianças e adolescentes.</p>

<h2>8. Alterações desta Política</h2>
<p>Podemos atualizar esta Política. A versão e a data de vigência aparecem no topo da página. Mudanças relevantes serão destacadas no site
   e, quando necessário, pediremos novo consentimento.</p>
    </TextoLegal>
  );
}
