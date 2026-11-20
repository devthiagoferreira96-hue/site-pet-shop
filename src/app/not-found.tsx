import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main id="conteudo" className="vazio glass">
      <h1>Página não encontrada</h1>
      <p className="mt">Essa página não existe ou foi movida.</p>
      <Link className="botao botao--hero" href="/">Voltar ao início</Link>
    </main>
  );
}
