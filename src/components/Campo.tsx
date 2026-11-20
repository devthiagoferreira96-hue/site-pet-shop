"use client";
/** Campo de formulário acessível: rótulo, dica e erro ligados por aria-describedby. */
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type Base = { nome: string; rotulo: string; erros: Record<string, string>; dica?: string; obrigatorio?: boolean };

export function Campo({ nome, rotulo, erros, dica, obrigatorio = true, ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const desc = [dica && `dica-${nome}`, erros[nome] && `erro-${nome}`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="campo">
      <label htmlFor={`f-${nome}`}>{rotulo}{obrigatorio ? <span className="obrigatorio" aria-hidden="true"> *</span> : <span className="dica"> (opcional)</span>}</label>
      <input id={`f-${nome}`} name={nome} required={obrigatorio} aria-required={obrigatorio || undefined}
        aria-invalid={erros[nome] ? true : undefined} aria-describedby={desc} {...props} />
      {dica && <p className="dica" id={`dica-${nome}`}>{dica}</p>}
      {erros[nome] && <p className="erro-campo" id={`erro-${nome}`}>{erros[nome]}</p>}
    </div>
  );
}

export function AreaTexto({ nome, rotulo, erros, dica, obrigatorio = true, ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const desc = [dica && `dica-${nome}`, erros[nome] && `erro-${nome}`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="campo">
      <label htmlFor={`f-${nome}`}>{rotulo}{obrigatorio ? <span className="obrigatorio" aria-hidden="true"> *</span> : <span className="dica"> (opcional)</span>}</label>
      <textarea id={`f-${nome}`} name={nome} required={obrigatorio} aria-invalid={erros[nome] ? true : undefined} aria-describedby={desc} {...props} />
      {dica && <p className="dica" id={`dica-${nome}`}>{dica}</p>}
      {erros[nome] && <p className="erro-campo" id={`erro-${nome}`}>{erros[nome]}</p>}
    </div>
  );
}

/** Resumo de erros no topo, com links para cada campo; recebe o foco ao aparecer. */
export function ResumoErros({ erros, mensagem }: { erros: Record<string, string>; mensagem?: string }) {
  const lista = Object.entries(erros).filter(([k]) => k !== "_");
  if (!lista.length && !mensagem) return null;
  return (
    <div className="alerta alerta--erro" role="alert" tabIndex={-1} ref={(el) => el?.focus()}>
      <p><strong>{mensagem ?? `Corrija ${lista.length} campo(s) para continuar:`}</strong></p>
      {lista.length > 0 && <ul>{lista.map(([k, v]) => <li key={k}><a href={`#f-${k}`}>{v}</a></li>)}</ul>}
    </div>
  );
}
