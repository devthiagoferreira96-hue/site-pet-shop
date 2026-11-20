import type { Metadata } from "next";
import { EMPRESA } from "@/config/empresa";
import { TextoLegal } from "@/components/legal/TextoLegal";

export const metadata: Metadata = { title: "Medicamentos Veterinários" };

export default function Medicamentos() {
  return (
    <TextoLegal titulo="Medicamentos Veterinários">
      <p>A venda de produtos de uso veterinário é fiscalizada pelo Ministério da Agricultura e Pecuária (MAPA). Nosso estabelecimento é registrado no
   MAPA sob nº {EMPRESA.registroMapa} e tem como responsável técnico o(a) médico(a)-veterinário(a)
   {EMPRESA.rtNome} ({EMPRESA.rtCrmv}).</p>

<h2>Como vendemos medicamentos</h2>
<table>
  <thead><tr><th scope="col">Tipo</th><th scope="col">Exemplo de indicação no rótulo</th><th scope="col">Como comprar</th></tr></thead>
  <tbody>
    <tr><td>Venda livre</td><td>Sem exigência de receita</td><td>Pelo site ou na loja</td></tr>
    <tr><td>Venda sob prescrição</td><td>“Venda sob prescrição e aplicação sob orientação do médico-veterinário”</td><td>Somente na loja física, com apresentação da receita</td></tr>
    <tr><td>Controle especial</td><td>Exige Notificação de Receita Veterinária (Portaria MAPA nº 837/2025)</td><td>Não exibido nem vendido pelo site</td></tr>
  </tbody>
</table>

<h2>Uso responsável</h2>
<ul>
  <li>Nenhuma informação deste site substitui a consulta com médico-veterinário. Não medique seu animal por conta própria.</li>
  <li>Leia a bula e respeite dose, espécie, peso e duração indicados. Nunca use medicamento de cão em gato (ou o contrário) sem orientação.</li>
  <li>Medicamentos de uso humano podem ser perigosos para animais.</li>
  <li>Se o seu pet tiver reação inesperada, procure um médico-veterinário e informe o fabricante pelo SAC indicado na embalagem.</li>
  <li>Não jogue sobras de medicamentos no lixo comum ou no esgoto; pergunte na loja sobre pontos de descarte.</li>
</ul>
    </TextoLegal>
  );
}
