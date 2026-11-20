import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA } from "@/config/empresa";
import { TextoLegal } from "@/components/legal/TextoLegal";

export const metadata: Metadata = { title: "Declaração de Acessibilidade" };

export default function Acessibilidade() {
  return (
    <TextoLegal titulo="Declaração de Acessibilidade">
      <p>Queremos que todas as pessoas consigam usar este site. Ele foi desenvolvido buscando atender às Diretrizes de Acessibilidade para Conteúdo Web
   (WCAG 2.2), nível AA, e ao art. 63 da Lei Brasileira de Inclusão (Lei nº 13.146/2015).</p>

<h2>O que fizemos</h2>
<ul>
  <li>Todo o site pode ser usado só com o teclado (Tab, Shift+Tab, Enter e espaço), com indicação visível de onde está o foco.</li>
  <li>Link “Pular para o conteúdo principal” no início de cada página.</li>
  <li>Cores com contraste mínimo de 4,5:1 para textos.</li>
  <li>Imagens de produtos com texto alternativo; imagens decorativas são ignoradas pelos leitores de tela.</li>
  <li>Formulários com rótulos, instruções e mensagens de erro que explicam como corrigir.</li>
  <li>Páginas organizadas com títulos e regiões (cabeçalho, navegação, conteúdo, rodapé).</li>
  <li>O texto pode ser ampliado até 200% sem perda de conteúdo, e o site se adapta a celulares.</li>
  <li>Sem animações automáticas e respeito à preferência de “reduzir movimento” do sistema.</li>
</ul>

<h2>Encontrou alguma barreira?</h2>
<p>Avise pelo <Link href="/contato">formulário de contato</Link>, pelo e-mail
   <a href={`mailto:${EMPRESA.emailAtendimento}`}>{EMPRESA.emailAtendimento}</a> ou pelo telefone {EMPRESA.telefone}.
   Também podemos concluir sua compra por telefone ou na loja.</p>
    </TextoLegal>
  );
}
