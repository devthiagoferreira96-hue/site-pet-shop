import { POLITICAS } from "@/config/empresa";
import { Revelar } from "@/components/animacao/Revelar";

export function TextoLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Revelar><article className="texto-legal glass-strong">
      <h1>{titulo}</h1>
      <p className="vigencia">Versão {POLITICAS.versao} · Vigente desde {POLITICAS.data}</p>
      {children}
    </article></Revelar>
  );
}
