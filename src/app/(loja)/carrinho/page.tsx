import type { Metadata } from "next";
import { CarrinhoPagina } from "@/components/loja/CarrinhoPagina";
import { EMPRESA } from "@/config/empresa";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };
export default function Carrinho() { return <CarrinhoPagina whatsapp={EMPRESA.whatsapp} />; }
