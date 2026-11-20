"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { IconeAnimado, useAnimarIcone } from "./animacao/IconeAnimado";
import { useCarrinho } from "./Carrinho";
import { MenuEstatico, MenuPrincipal } from "./MenuPrincipal";

export function Cabecalho() {
  const router = useRouter();
  const caminho = usePathname();
  // vidro só enquanto o cabeçalho está sobre a foto da capa (.hero--imersivo); no resto do site, barra sólida
  const [sobreHero, setSobreHero] = useState(() => caminho === "/");
  const { quantidadeTotal } = useCarrinho();
  const [busca, setBusca] = useState("");
  const busca_ = useAnimarIcone();
  const carrinho = useAnimarIcone();
  const anterior = useRef(quantidadeTotal);
  const [pulo, setPulo] = useState(false);

  // Cabeçalho que recolhe: rolando para baixo some a linha de links e fica só a barra de busca;
  // rolando para cima (ou voltando ao topo) os links reaparecem.
  const [recolhido, setRecolhido] = useState(false);
  const [alturaCheia, setAlturaCheia] = useState<number | null>(null);
  const barra = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuInt = useRef<HTMLDivElement>(null);
  const focoNoTopo = useRef(false);   // foco de TECLADO dentro do cabeçalho: não recolhe (o foco não pode sumir)
  const teclado = useRef(false);      // a última interação foi Tab? (clicar na busca com o mouse não conta)

  useEffect(() => {
    const TOPO = 80;       // até aqui o cabeçalho fica sempre completo
    const SENSIBILIDADE = 12; // px seguidos na mesma direção, para ignorar tremidinhas do trackpad
    let ultimo = window.scrollY, acumulado = 0, pendente = false;
    const aoRolar = () => {
      if (pendente) return; pendente = true;
      requestAnimationFrame(() => {
        pendente = false;
        const y = Math.max(0, window.scrollY), dy = y - ultimo; ultimo = y;
        if (y <= TOPO) { acumulado = 0; setRecolhido(false); return; }
        if (focoNoTopo.current || !dy) return;
        if (Math.sign(dy) !== Math.sign(acumulado)) acumulado = 0;
        acumulado += dy;
        if (acumulado > SENSIBILIDADE) setRecolhido(true);
        else if (acumulado < -SENSIBILIDADE) setRecolhido(false);
      });
    };
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === "Tab") teclado.current = true; };
    const aoPonteiro = () => { teclado.current = false; };
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("keydown", aoTeclar, true);
    window.addEventListener("pointerdown", aoPonteiro, true);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("keydown", aoTeclar, true);
      window.removeEventListener("pointerdown", aoPonteiro, true);
    };
  }, []);

  // O cabeçalho é sticky e ocupa lugar no fluxo da página. Se ele encolhesse de verdade, o conteúdo abaixo "pularia" e o
  // navegador compensaria rolando de volta (vai-e-vem). Por isso o contêiner guarda a ALTURA CHEIA e só o vidro encolhe.
  // altura cheia = barra sem a linha de links + altura natural da linha de links (vale em qualquer fase da animação).
  useEffect(() => {
    const b = barra.current, m = menu.current, i = menuInt.current;
    if (!b || !m || !i) return;
    const medir = () => {
      const h = Math.ceil(b.offsetHeight - m.offsetHeight + i.scrollHeight);
      setAlturaCheia(h);
      document.documentElement.style.setProperty("--topo-h", `${h}px`); // a capa imersiva sobe exatamente isso
    };
    const ro = new ResizeObserver(medir);
    ro.observe(b); ro.observe(i);
    medir();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let pendente = false;
    const checar = () => {
      if (pendente) return; pendente = true;
      requestAnimationFrame(() => {
        pendente = false;
        const hero = document.querySelector<HTMLElement>(".hero--imersivo"), b = barra.current;
        setSobreHero(Boolean(hero && b && hero.getBoundingClientRect().bottom > b.getBoundingClientRect().bottom + 8));
      });
    };
    checar();
    window.addEventListener("scroll", checar, { passive: true });
    window.addEventListener("resize", checar);
    return () => { window.removeEventListener("scroll", checar); window.removeEventListener("resize", checar); };
  }, [caminho]);

  useEffect(() => {
    // quando um item entra no carrinho, o ícone anima e o contador dá um "pulo"
    if (quantidadeTotal > anterior.current) { carrinho.iniciar(); setPulo(true); const t = setTimeout(() => setPulo(false), 500); anterior.current = quantidadeTotal; return () => clearTimeout(t); }
    anterior.current = quantidadeTotal;
  }, [quantidadeTotal, carrinho.iniciar]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <header
        className={`topo${recolhido ? " topo--recolhido" : ""}${sobreHero ? " topo--vidro" : ""}`}
        style={alturaCheia ? { height: alturaCheia } : undefined}
        onFocusCapture={() => { if (teclado.current) { focoNoTopo.current = true; setRecolhido(false); } }}
        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focoNoTopo.current = false; }}>
        <div className="topo__barra" ref={barra}>
          <Link className="marca" href="/" aria-label="Pet Shop — página inicial">
            <img className="marca__logo" src="/img/logo.webp" alt="" width={42} height={42} />
            <span className="marca__texto" aria-hidden="true"><span className="marca__nome">Pet Shop</span><span className="marca__sub">Loja online</span></span>
          </Link>
          <form className="busca-topo" role="search" onFocus={busca_.gatilhos.onFocus} onBlur={busca_.gatilhos.onBlur} onSubmit={(e) => { e.preventDefault(); router.push(`/produtos?q=${encodeURIComponent(busca.trim())}`); }}>
            <label htmlFor="busca-topo" className="sr-only">Buscar produtos</label>
            <IconeAnimado nome="busca" tamanho={18} controle={busca_.controle} className="busca-topo__icone" />
            <input id="busca-topo" type="search" placeholder="Buscar produto..." maxLength={80} value={busca} onChange={(e) => setBusca(e.target.value)} />
          </form>
          <div className="topo__acoes">
            <Link className="botao-icone botao-icone--primario" href="/carrinho" {...carrinho.gatilhos}>
              <IconeAnimado nome="carrinho" tamanho={20} controle={carrinho.controle} />
              <span className="sr-only">Carrinho, {quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"}</span>
              {quantidadeTotal > 0 && <span className={`contador${pulo ? " contador--pulo" : ""}`} aria-hidden="true">{quantidadeTotal}</span>}
            </Link>
          </div>
          {/* 2ª linha: links de navegação (a ordem no HTML segue a ordem visual: busca, carrinho, menu) */}
          <div className="topo__menu" ref={menu}>
            <div className="topo__menu-int" ref={menuInt}>
              <nav className="topo__menu-nav" aria-label="Principal">
                <Suspense fallback={<MenuEstatico />}><MenuPrincipal /></Suspense>
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
