"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconeAnimado, useAnimarIcone } from "./animacao/IconeAnimado";
import { useCarrinho } from "./Carrinho";
import { useAnunciar } from "./Anunciador";

export function BotaoAdicionar({ produtoId, nome, maximo = 20, comQuantidade = false }: { produtoId: number; nome: string; maximo?: number; comQuantidade?: boolean }) {
  const { adicionar } = useCarrinho();
  const anunciar = useAnunciar();
  const router = useRouter();
  const [qtd, setQtd] = useState(1);
  const max = Math.max(1, Math.min(20, maximo));
  const [adicionado, setAdicionado] = useState(false);
  const anim = useAnimarIcone();

  const enviar = () => {
    adicionar(produtoId, qtd);
    anunciar(`${nome} adicionado ao carrinho.`);
    if (comQuantidade) { router.push("/carrinho"); return; }
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1600);
  };

  if (!comQuantidade)
    return (
      <button type="button" className={`botao botao--largo ${adicionado ? "botao--sucesso" : "botao--hero"}`} onClick={enviar} {...anim.gatilhos}>
        {adicionado
          ? <><IconeAoMontarCheck /> Adicionado</>
          : <><IconeAnimado nome="carrinho" tamanho={18} controle={anim.controle} /> Adicionar</>}
        <span className="sr-only"> {nome} ao carrinho</span>
      </button>
    );
  return (
    <div className="compra">
      <Quantidade valor={qtd} min={1} max={max} rotulo="Quantidade" onChange={setQtd} id="qtd" />
      <button type="button" className="botao botao--hero botao--grande" onClick={enviar} {...anim.gatilhos}>
        <IconeAnimado nome="carrinho" tamanho={20} controle={anim.controle} /> Adicionar ao carrinho</button>
    </div>
  );
}

function IconeAoMontarCheck() {
  const { controle, iniciar } = useAnimarIcone();
  useEffect(() => { iniciar(); }, [iniciar]);
  return <IconeAnimado nome="check" tamanho={18} controle={controle} />;
}

export function Quantidade({ valor, min, max, rotulo, onChange, id }: { valor: number; min: number; max: number; rotulo: string; onChange: (n: number) => void; id: string }) {
  const anunciar = useAnunciar();
  const mudar = (n: number) => { const v = Math.max(min, Math.min(max, n)); onChange(v); anunciar(`Quantidade: ${v}`); };
  return (
    <div className="qtd glass">
      <button type="button" aria-label={`Diminuir ${rotulo.toLowerCase()}`} onClick={() => mudar(valor - 1)} disabled={valor <= min}>−</button>
      <label htmlFor={id} className="sr-only">{rotulo}</label>
      <input id={id} type="number" inputMode="numeric" min={min} max={max} value={valor} onChange={(e) => mudar(Number(e.target.value) || min)} />
      <button type="button" aria-label={`Aumentar ${rotulo.toLowerCase()}`} onClick={() => mudar(valor + 1)} disabled={valor >= max}>+</button>
    </div>
  );
}
