"use client";
/**
 * Proteção contra robôs nos formulários públicos.
 *  - <Armadilha/>: campo invisível para pessoas (robôs preenchem e o servidor descarta o envio).
 *  - <VerificacaoHumana/>: Cloudflare Turnstile, OPCIONAL. Só aparece se NEXT_PUBLIC_TURNSTILE_SITE_KEY e
 *    TURNSTILE_SECRET estiverem no .env. Ao ligar, cite a Cloudflare na Política de Privacidade (já previsto lá).
 */
import { useEffect, useRef } from "react";

const CHAVE_SITE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
type Turnstile = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void };

export const turnstileAtivo = () => Boolean(CHAVE_SITE);

export function Armadilha({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <div className="armadilha" aria-hidden="true">
      <label htmlFor="f-site">Não preencha este campo</label>
      <input id="f-site" name="site" type="text" tabIndex={-1} autoComplete="off" value={valor} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function carregarScript(): Promise<void> {
  const w = window as unknown as { turnstile?: Turnstile };
  if (w.turnstile) return Promise.resolve();
  return new Promise((ok, falha) => {
    let s = document.getElementById("cf-turnstile") as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = "cf-turnstile";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => ok());
    s.addEventListener("error", () => falha(new Error("Turnstile indisponível")));
  });
}

export function VerificacaoHumana({ onToken }: { onToken: (token: string) => void }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!CHAVE_SITE || !caixa.current) return;
    let id = "";
    let ativo = true;
    carregarScript().then(() => {
      const t = (window as unknown as { turnstile?: Turnstile }).turnstile;
      if (!ativo || !t || !caixa.current) return;
      id = t.render(caixa.current, {
        sitekey: CHAVE_SITE, language: "pt-br", theme: "light",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }).catch(() => onToken(""));
    return () => { ativo = false; const t = (window as unknown as { turnstile?: Turnstile }).turnstile; if (id && t) t.remove(id); };
  }, [onToken]);
  if (!CHAVE_SITE) return null;
  return <div className="campo" ref={caixa} aria-label="Verificação de segurança" />;
}
