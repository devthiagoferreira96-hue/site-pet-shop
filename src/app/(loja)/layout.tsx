import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { Cookies } from "@/components/Cookies";
import { Parallax } from "@/components/Parallax";
import { CarrinhoProvider } from "@/components/Carrinho";
import { GA4_ID } from "@/config/empresa";

export default function LayoutLoja({ children }: { children: React.ReactNode }) {
  return (
    <CarrinhoProvider>
      <Cabecalho />
      <main id="conteudo" tabIndex={-1}>{children}</main>
      <Rodape />
      <Cookies ga4Id={GA4_ID} />
      <Parallax />
    </CarrinhoProvider>
  );
}
