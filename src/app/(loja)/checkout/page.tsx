import type { Metadata } from "next";
import { Checkout } from "@/components/loja/Checkout";
import { EMPRESA, ENTREGA, POLITICAS } from "@/config/empresa";

export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false } };
export default function PaginaCheckout() {
  return <div className="pagina"><Checkout termosVersao={POLITICAS.versao} endereco={EMPRESA.endereco} horario={EMPRESA.horario} entrega={ENTREGA} /></div>;
}
