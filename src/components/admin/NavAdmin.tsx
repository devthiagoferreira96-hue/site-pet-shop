"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../api-cliente";
import { BotaoAnimado } from "../animacao/Animados";

const LINKS = [["/admin", "Painel"], ["/admin/produtos", "Produtos"], ["/admin/estoque", "Estoque SimplesVet"], ["/admin/pedidos", "Pedidos"],
  ["/admin/solicitacoes", "Solicitações (LGPD/CDC)"], ["/admin/contatos", "Mensagens"], ["/admin/senha", "Senha e sessões"], ["/", "Ver site"]] as const;

export function NavAdmin({ nome }: { nome: string }) {
  const caminho = usePathname();
  const router = useRouter();
  return (
    <header className="admin-topo">
      <div className="admin-topo__barra glass-strong">
        <strong className="marca__nome">Admin · Pet Shop</strong>
        <nav aria-label="Menu do painel">
          <ul>
            {LINKS.map(([href, rotulo]) => (
              <li key={href}><Link href={href} aria-current={caminho === href || (href !== "/admin" && href !== "/" && caminho.startsWith(href)) ? "page" : undefined}>{rotulo}</Link></li>
            ))}
            <li><BotaoAnimado type="button" className="botao-link linha-icone" icone="sair" tamanho={18} onClick={async () => { await api("/auth/logout", { method: "POST" }); router.replace("/admin/login"); }}>Sair ({nome})</BotaoAnimado></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
