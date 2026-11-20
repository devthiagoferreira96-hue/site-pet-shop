"use client";
/**
 * Consentimento de cookies (Guia Orientativo da ANPD): nada opcional antes do "sim"; Aceitar/Rejeitar/Personalizar
 * com o mesmo destaque; categorias desligadas por padrão; revogação a qualquer momento pelo rodapé.
 * O banner só aparece se houver ferramenta opcional configurada (NEXT_PUBLIC_GA4_ID).
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const COOKIE = "ma_consentimento";
const VERSAO = 1;
type Consentimento = { v: number; estatistica: boolean; data: string };

function ler(): Consentimento | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  if (!m) return null;
  try { const c = JSON.parse(decodeURIComponent(m[1])); return c?.v === VERSAO ? c : null; } catch { return null; }
}
function salvar(estatistica: boolean) {
  const v: Consentimento = { v: VERSAO, estatistica, data: new Date().toISOString() };
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(v))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
function apagarAnalytics() {
  for (const par of document.cookie.split("; ")) {
    const nome = par.split("=")[0];
    if (/^_ga/.test(nome)) for (const d of ["", `; Domain=${location.hostname}`, `; Domain=.${location.hostname.replace(/^www\./, "")}`])
      document.cookie = `${nome}=; Max-Age=0; Path=/${d}`;
  }
}
function carregarGA(id: string) {
  if (document.getElementById("ga4")) return;
  const s = document.createElement("script");
  s.id = "ga4"; s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
  w.gtag("js", new Date());
  w.gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
}

export function Cookies({ ga4Id }: { ga4Id: string }) {
  const [banner, setBanner] = useState(false);
  const [estat, setEstat] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const ultimoFoco = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const c = ler();
    if (ga4Id && !c) setBanner(true);
    if (ga4Id && c?.estatistica) carregarGA(ga4Id);
    const abrir = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-abrir-cookies]")) return;
      ultimoFoco.current = document.activeElement as HTMLElement;
      setEstat(Boolean(ler()?.estatistica));
      dialogo.current?.showModal();
    };
    document.addEventListener("click", abrir);
    return () => document.removeEventListener("click", abrir);
  }, [ga4Id]);

  function decidir(estatistica: boolean) {
    const antes = ler();
    salvar(estatistica);
    setBanner(false);
    dialogo.current?.close();
    if (antes?.estatistica && !estatistica) { apagarAnalytics(); location.reload(); return; }
    if (estatistica && ga4Id) carregarGA(ga4Id);
  }

  return (
    <>
      {banner && (
        <section className="cookies-banner glass-strong" aria-labelledby="cookies-titulo">
          <div className="cookies-banner__conteudo">
            <div>
              <h2 id="cookies-titulo">Sua privacidade</h2>
              <p>Usamos cookies necessários para o site funcionar. Com a sua permissão, também usaremos cookies de estatística para entender
                como o site é usado. Você pode mudar sua escolha quando quiser. <Link href="/politica-de-cookies">Saiba mais na Política de Cookies</Link>.</p>
            </div>
            <div className="cookies-banner__botoes">
              <button type="button" className="botao botao--hero" onClick={() => decidir(true)}>Aceitar todos</button>
              <button type="button" className="botao botao--hero" onClick={() => decidir(false)}>Rejeitar não necessários</button>
              <button type="button" className="botao botao--hero" data-abrir-cookies>Personalizar</button>
            </div>
          </div>
        </section>
      )}
      <dialog ref={dialogo} className="cookies-dialogo" aria-labelledby="cookies-dialogo-titulo" onClose={() => ultimoFoco.current?.focus()}>
        <h2 id="cookies-dialogo-titulo">Preferências de cookies</h2>
        <div className="cookie-cat">
          <input type="checkbox" id="ck-nec" checked disabled readOnly />
          <label htmlFor="ck-nec"><strong>Necessários</strong> (sempre ativos)</label>
          <p>Lembram sua escolha sobre cookies e mantêm o login do painel administrativo. O carrinho fica salvo no seu navegador e
            guarda só os produtos escolhidos, sem dados pessoais.</p>
        </div>
        {ga4Id ? (
          <div className="cookie-cat">
            <input type="checkbox" id="ck-estat" checked={estat} onChange={(e) => setEstat(e.target.checked)} />
            <label htmlFor="ck-estat"><strong>Estatística</strong> (Google Analytics 4)</label>
            <p>Contam visitas e páginas acessadas de forma agregada. Só são ativados se você permitir.</p>
          </div>
        ) : (
          <p className="cookie-cat">No momento este site <strong>não usa</strong> cookies de estatística, publicidade ou redes sociais.</p>
        )}
        <p>Você também pode apagar ou bloquear cookies nas configurações do navegador.</p>
        <div className="cookies-dialogo__botoes">
          {ga4Id && <button type="button" className="botao botao--hero" onClick={() => decidir(estat)}>Salvar minhas escolhas</button>}
          {ga4Id && <button type="button" className="botao botao--hero" onClick={() => decidir(false)}>Rejeitar não necessários</button>}
          <button type="button" className="botao botao--glass" onClick={() => dialogo.current?.close()}>Fechar</button>
        </div>
      </dialog>
    </>
  );
}
