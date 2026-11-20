"use client";
import { useEffect } from "react";

/** Atualiza a variável CSS --y com a rolagem (efeito parallax do Lovable). Desliga com "reduzir movimento". */
export function Parallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const raiz = document.documentElement;
    const aoRolar = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => raiz.style.setProperty("--y", String(window.scrollY))); };
    window.addEventListener("scroll", aoRolar, { passive: true });
    aoRolar();
    return () => { window.removeEventListener("scroll", aoRolar); cancelAnimationFrame(raf); raiz.style.removeProperty("--y"); };
  }, []);
  return null;
}
