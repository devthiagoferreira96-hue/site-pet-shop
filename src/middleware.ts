/**
 * Roda antes de toda requisição:
 *  1. Força HTTPS em produção (redireciona http -> https; o HSTS do next.config faz o navegador lembrar).
 *  2. Content-Security-Policy com NONCE: só executam scripts do próprio site marcados com o nonce desta
 *     requisição (e os que eles carregarem, via 'strict-dynamic'). Script injetado por invasor não roda.
 *  3. Barreira extra do painel: sem cookie de sessão, nem chega a renderizar /admin (a validação de verdade
 *     continua no servidor, em app/admin/(painel)/layout.tsx e em cada rota /api/v1/admin).
 */
import { NextResponse, type NextRequest } from "next/server";

const PRODUCAO = process.env.NODE_ENV === "production";
const COOKIE = PRODUCAO ? "__Host-ma_sessao" : "ma_sessao";
const GA = Boolean(process.env.NEXT_PUBLIC_GA4_ID);
const TURNSTILE = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

function montarCsp(nonce: string) {
  const ga = GA ? " https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com" : "";
  const cf = TURNSTILE ? " https://challenges.cloudflare.com" : "";
  return [
    "default-src 'self'",
    // em desenvolvimento o Next precisa de eval para recarregar o código; em produção, não
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${PRODUCAO ? "" : " 'unsafe-eval'"}${ga}${cf}`,
    "style-src 'self' 'unsafe-inline'", // animações (Motion) e React usam style="" — não executa código
    `img-src 'self' data: blob:${ga}`,
    "font-src 'self'",
    `connect-src 'self'${ga}${cf}${PRODUCAO ? "" : " ws: wss:"}`,
    `frame-src${TURNSTILE ? cf : " 'none'"}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(PRODUCAO ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function middleware(req: NextRequest) {
  // 1. HTTPS obrigatório (atrás de proxy/CDN, o protocolo original vem em x-forwarded-proto)
  if (PRODUCAO && req.headers.get("x-forwarded-proto") === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // 3. painel sem sessão -> login (exceto a própria tela de login)
  const caminho = req.nextUrl.pathname;
  if (caminho.startsWith("/admin") && !caminho.startsWith("/admin/login") && !req.cookies.get(COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // 2. CSP com nonce novo a cada requisição (o Next aplica o nonce nos próprios scripts automaticamente)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = montarCsp(nonce);
  const cabecalhos = new Headers(req.headers);
  cabecalhos.set("x-nonce", nonce);
  cabecalhos.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers: cabecalhos } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // não roda em arquivos estáticos e imagens (não precisam de CSP com nonce)
  matcher: [{ source: "/((?!_next/static|_next/image|img/|fonts/|favicon|robots.txt).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
