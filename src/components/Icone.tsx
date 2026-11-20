/** Ícones SVG em traço, sempre decorativos (aria-hidden). O texto ao lado dá o significado. */
const CAMINHOS: Record<string, React.ReactNode> = {
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  coracao: <><path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 0 1 12 6a5 5 0 0 1 7.5 6.6Z" /><path d="M4 12h4l2-3 3 6 2-3h5" /></>,
  loja: <><path d="M3 9 5 4h14l2 5" /><path d="M4 9v11h16V9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M10 20v-5h4v5" /></>,
  mensagem: <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />,
  pata: <><circle cx="11" cy="4.5" r="2" /><circle cx="18" cy="8.5" r="2" /><circle cx="4.5" cy="9.5" r="2" /><circle cx="16" cy="3.8" r="1.6" /><path d="M8.5 14.5c1.2-2.4 4.8-2.6 6.3-.3l2 3a2.6 2.6 0 0 1-3 3.9c-1.4-.4-2.6-.4-4 0a2.6 2.6 0 0 1-3-3.7Z" /></>,
  osso: <path d="M17 10c.7-.7 1.7-.7 2.6-.3a2.5 2.5 0 1 0-1.3-3.4 2.5 2.5 0 1 0-3.4-1.3c.4.9.4 1.9-.3 2.6l-7.2 7.2c-.7.7-1.7.7-2.6.3a2.5 2.5 0 1 0 1.3 3.4 2.5 2.5 0 1 0 3.4 1.3c-.4-.9-.4-1.9.3-2.6Z" />,
  carrinho: <><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" /></>,
  busca: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  lixeira: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />,
  receita: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M12 12v4M12 19h.01" /></>,
  cartao: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  calendario: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
};

export function Icone({ nome, className = "icone" }: { nome: keyof typeof CAMINHOS | string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {CAMINHOS[nome]}
    </svg>
  );
}
