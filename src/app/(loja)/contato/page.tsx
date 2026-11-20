import type { Metadata } from "next";
import { FormContato } from "@/components/loja/Formularios";
import { EMPRESA, RETENCAO } from "@/config/empresa";

export const metadata: Metadata = { title: "Fale conosco" };
export default function Contato() {
  return (
    <div className="cartao-form glass-strong">
      <h1>Fale conosco</h1>
      <p>Respondemos pelo e-mail informado em até 5 dias úteis. Telefone: {EMPRESA.telefone} · {EMPRESA.horario}.</p>
      <FormContato retencaoDias={RETENCAO.contatoDias} />
    </div>
  );
}
