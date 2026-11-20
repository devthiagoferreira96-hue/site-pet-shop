import type { Metadata } from "next";
import { GA4_ID } from "@/config/empresa";
import { TextoLegal } from "@/components/legal/TextoLegal";

export const metadata: Metadata = { title: "Política de Cookies" };

export default function PoliticaCookies() {
  return (
    <TextoLegal titulo="Política de Cookies">
      <p>Cookies são pequenos arquivos gravados no seu navegador. Esta página lista todos os cookies e dados guardados no navegador por este site.
   Ela segue o Guia Orientativo “Cookies e Proteção de Dados Pessoais” da Autoridade Nacional de Proteção de Dados (ANPD).</p>

<h2>Cookies que usamos</h2>
<table>
  <caption className="sr-only">Lista de cookies</caption>
  <thead><tr><th scope="col">Nome</th><th scope="col">Categoria</th><th scope="col">Para quê</th><th scope="col">Duração</th><th scope="col">De quem</th></tr></thead>
  <tbody>
    <tr><td>ma_consentimento (cookie)</td><td>Necessário</td><td>Lembra a sua escolha sobre cookies</td><td>180 dias</td><td>Este site</td></tr>
    <tr><td>ma_carrinho (armazenamento local do navegador)</td><td>Necessário</td><td>Guarda os produtos e quantidades do carrinho. Não contém dados pessoais nem preços</td><td>Até você esvaziar o carrinho ou limpar os dados do navegador</td><td>Este site</td></tr>
    <tr><td>ma_sessao (cookie)</td><td>Necessário</td><td>Somente para funcionários: mantém o login do painel administrativo. Contém apenas um código aleatório; os dados ficam no servidor</td><td>8 horas</td><td>Este site</td></tr>
    {GA4_ID && (<>
    <tr><td>_ga, _ga_*</td><td>Estatística (opcional)</td><td>Contar visitas e páginas vistas de forma agregada (Google Analytics 4), sem sinais de publicidade</td><td>Até 2 anos</td><td>Google</td></tr>
    </>)}
  </tbody>
</table>
{!GA4_ID && (<>
<p>No momento <strong>não usamos</strong> cookies de estatística, publicidade, redes sociais ou de terceiros. Se isso mudar, esta página será
   atualizada e pediremos o seu consentimento antes de ativá-los.</p>
</>)}

<h2>Base legal</h2>
<p>Cookies necessários são usados com base na execução do contrato e no legítimo interesse, porque sem eles o site não funciona.
   Cookies opcionais só são ativados com o seu consentimento, que vem desmarcado por padrão.</p>

<h2>Como mudar sua escolha</h2>
<p>Use o botão abaixo ou o link “Preferências de cookies” no rodapé de qualquer página. Você também pode apagar ou bloquear cookies nas
   configurações do navegador; bloquear os cookies necessários impede o funcionamento do carrinho.</p>
<p><button type="button" className="botao botao--primario" data-abrir-cookies>Abrir preferências de cookies</button></p>
    </TextoLegal>
  );
}
