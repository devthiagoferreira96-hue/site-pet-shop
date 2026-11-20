import Link from "next/link";
import { EMPRESA } from "@/config/empresa";
import { IconeAoAparecer } from "./animacao/IconeAnimado";
import { Revelar } from "./animacao/Revelar";

export function Rodape() {
  return (
    <footer className="rodape">
      <Revelar className="rodape__caixa">
        <div className="rodape__grade">
          <section aria-labelledby="rod-marca">
            <h2 id="rod-marca" className="rodape__marca">Pet Shop</h2>
            <p>Rações, acessórios e medicações para o seu pet.</p>
            <p className="mt"><strong>Medicações com receita</strong><br />Vendidas apenas na loja física, mediante apresentação da receita veterinária.</p>
          </section>
          <section aria-labelledby="rod-pol">
            <h2 id="rod-pol">Políticas</h2>
            <ul>
              <li><Link href="/termos-de-uso">Termos de Uso e Venda</Link></li>
              <li><Link href="/politica-de-privacidade">Política de Privacidade</Link></li>
              <li><Link href="/politica-de-cookies">Política de Cookies</Link></li>
              <li><Link href="/trocas-devolucoes-e-reembolso">Trocas e Reembolso</Link></li>
              <li><Link href="/entrega-e-retirada">Entrega e Retirada</Link></li>
              <li><Link href="/medicamentos-veterinarios">Medicamentos veterinários</Link></li>
            </ul>
          </section>
          <section aria-labelledby="rod-at">
            <h2 id="rod-at">Atendimento</h2>
            <ul>
              <li><Link href="/contato">Fale conosco</Link></li>
              <li><Link href="/arrependimento">Desistir da compra / trocas</Link></li>
              <li><Link href="/meus-dados">Seus dados pessoais (LGPD)</Link></li>
              <li><Link href="/acessibilidade">Acessibilidade</Link></li>
              <li><button type="button" className="botao-link" data-abrir-cookies>Preferências de cookies</button></li>
            </ul>
          </section>
          <section aria-labelledby="rod-cont">
            <h2 id="rod-cont">Contato</h2>
            <p className="linha-icone"><IconeAoAparecer nome="telefone" tamanho={18} /> {EMPRESA.telefone}</p>
            <p><a href={`mailto:${EMPRESA.emailAtendimento}`}>{EMPRESA.emailAtendimento}</a></p>
            <p className="linha-icone"><IconeAoAparecer nome="relogio" tamanho={18} /> {EMPRESA.horario}</p>
          </section>
        </div>
        <div className="rodape__legal">
          <p><strong>{EMPRESA.razaoSocial}</strong> — CNPJ {EMPRESA.cnpj} — {EMPRESA.endereco}</p>
          <p>Responsável técnico: {EMPRESA.rtNome} ({EMPRESA.rtCrmv}) · Registro do estabelecimento no MAPA: {EMPRESA.registroMapa}</p>
          <p>© {new Date().getFullYear()} {EMPRESA.nomeFantasia}. Preços válidos para compras neste site.</p>
        </div>
      </Revelar>
    </footer>
  );
}
