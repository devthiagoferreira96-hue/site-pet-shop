"use client";
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="vazio glass" role="alert">
      <h1>Esta página não carregou</h1>
      <p className="mt">Algo deu errado. Tente novamente.</p>
      <button type="button" className="botao botao--hero" onClick={reset}>Tentar novamente</button>
    </div>
  );
}
