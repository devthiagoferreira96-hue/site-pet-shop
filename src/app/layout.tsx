import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { existsSync } from "node:fs";
import path from "node:path";
import "./globals.css";
import { AnunciadorProvider } from "@/components/Anunciador";
import { ProvedorMovimento } from "@/components/animacao/ProvedorMovimento";
import { camposPendentes, PRODUCAO } from "@/config/empresa";
import { chaveConfigurada } from "@/domain/cripto";

export const metadata: Metadata = {
  title: { default: "Pet Shop — Rações, acessórios e medicações", template: "%s — Pet Shop" },
  description: "Rações, acessórios e medicações para o seu melhor amigo. Compre pelo site e retire na loja.",
  icons: { icon: "/img/favicon.png" },
  openGraph: { title: "Pet Shop", description: "Rações, acessórios e medicações para o seu melhor amigo.", type: "website" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Fontes servidas pelo próprio site (sem Google Fonts). Só carrega se os arquivos existirem.
const fontesLocais = ["Fraunces.woff2", "Figtree.woff2"].every((f) => existsSync(path.join(process.cwd(), "public", "fonts", f)));

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Ler o nonce torna TODAS as páginas dinâmicas: obrigatório para a CSP com nonce (src/middleware.ts).
  // Página pré-gerada no build não teria o nonce da requisição e os scripts dela seriam bloqueados.
  await headers();
  const pendentes = camposPendentes();
  return (
    <html lang="pt-BR">
      <head>{fontesLocais && <link rel="stylesheet" href="/fonts/fonts.css" />}</head>
      <body>
        <a className="pular-link" href="#conteudo">Pular para o conteúdo principal</a>
        {!PRODUCAO && !chaveConfigurada() && (
          <div className="faixa-dev" role="alert">Falta a <code>DADOS_CHAVE</code> no <code>.env</code> (criptografia dos dados pessoais): pedidos, contatos e solicitações não serão gravados. Rode <code>npm run gerar-segredos</code>, copie para o <code>.env</code> e reinicie.</div>
        )}
        {pendentes.length > 0 && !PRODUCAO && (
          <div className="faixa-dev" role="note">Modo desenvolvimento: dados legais da empresa ainda não preenchidos (<code>.env</code>). O site não inicia em produção assim.</div>
        )}
        <ProvedorMovimento><AnunciadorProvider>{children}</AnunciadorProvider></ProvedorMovimento>
      </body>
    </html>
  );
}
