"use client";
import { useCallback, useState } from "react";
import { Armadilha, VerificacaoHumana } from "../Humano";
import { api } from "../api-cliente";
import { AreaTexto, Campo, ResumoErros } from "../Campo";
import { BotaoAnimado } from "../animacao/Animados";
import { IconeAoMontar } from "../animacao/IconeAnimado";

export function FormContato({ retencaoDias }: { retencaoDias: number }) {
  const [f, setF] = useState({ nome: "", email: "", assunto: "", mensagem: "", site: "" });
  const [humano, setHumano] = useState("");
  const aoToken = useCallback((t: string) => setHumano(t), []);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [ok, setOk] = useState("");
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((a) => ({ ...a, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true);
    const r = await api<{ mensagem: string }>("/contato", { corpo: { ...f, humano } });
    setEnviando(false);
    if (r.dados) { setOk(r.dados.mensagem); setErros({}); setF({ nome: "", email: "", assunto: "", mensagem: "", site: "" }); }
    else setErros(r.erro?.campos ?? { _: r.erro?.mensagem ?? "Erro ao enviar." });
  }
  return (
    <form noValidate onSubmit={enviar}>
      {ok && <p className="alerta alerta--sucesso titulo-com-icone" role="status"><IconeAoMontar nome="sucesso" tamanho={24} /> {ok}</p>}
      <ResumoErros erros={erros} mensagem={erros._} />
      <Campo nome="nome" rotulo="Nome" erros={erros} value={f.nome} onChange={set("nome")} autoComplete="name" maxLength={120} />
      <Campo nome="email" rotulo="E-mail para resposta" erros={erros} type="email" value={f.email} onChange={set("email")} autoComplete="email" maxLength={254} />
      <Campo nome="assunto" rotulo="Assunto" erros={erros} value={f.assunto} onChange={set("assunto")} maxLength={150} />
      <AreaTexto nome="mensagem" rotulo="Mensagem" erros={erros} value={f.mensagem} onChange={set("mensagem")} maxLength={3000}
        dica="Não envie dados de saúde do seu pet, documentos ou dados de cartão por aqui." />
      <Armadilha valor={f.site} onChange={(v) => setF((a) => ({ ...a, site: v }))} />
      <VerificacaoHumana onToken={aoToken} />
      <p className="dica">Usaremos seus dados só para responder e os apagaremos após {retencaoDias} dias. <a href="/politica-de-privacidade">Política de Privacidade</a>.</p>
      <BotaoAnimado type="submit" className="botao botao--hero mt" disabled={enviando} icone="mensagem">{enviando ? "Enviando…" : "Enviar mensagem"}</BotaoAnimado>
    </form>
  );
}

export function FormSolicitacao({ tipos }: { tipos: Record<string, string> }) {
  const [f, setF] = useState({ tipo: "", nome: "", email: "", codigoPedido: "", detalhes: "", site: "" });
  const [humano, setHumano] = useState("");
  const aoToken = useCallback((t: string) => setHumano(t), []);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [protocolo, setProtocolo] = useState<{ protocolo: string; prazo: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((a) => ({ ...a, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true);
    const r = await api<{ protocolo: string; prazo: string }>("/solicitacoes", { corpo: { ...f, humano } });
    setEnviando(false);
    if (r.dados) setProtocolo(r.dados); else setErros(r.erro?.campos ?? { _: r.erro?.mensagem ?? "Erro ao enviar." });
  }
  if (protocolo)
    return (
      <div role="status">
        <h2 className="titulo-com-icone"><IconeAoMontar nome="sucesso" tamanho={36} className="icone-sucesso" /> Solicitação registrada</h2>
        <p>Protocolo: <strong>{protocolo.protocolo}</strong>. Guarde este número. Prazo de resposta: {protocolo.prazo}.</p>
        <p className="nota mt">Para proteger seus dados, poderemos confirmar sua identidade pelo e-mail informado antes de atender.</p>
      </div>
    );
  return (
    <form noValidate onSubmit={enviar}>
      <ResumoErros erros={erros} mensagem={erros._} />
      <div className="campo">
        <label htmlFor="f-tipo">O que você deseja? <span className="obrigatorio" aria-hidden="true">*</span></label>
        <select id="f-tipo" value={f.tipo} onChange={set("tipo")} required aria-invalid={erros.tipo ? true : undefined} aria-describedby={erros.tipo ? "erro-tipo" : undefined}>
          <option value="">Selecione</option>
          {Object.entries(tipos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {erros.tipo && <p className="erro-campo" id="erro-tipo">{erros.tipo}</p>}
      </div>
      <Campo nome="nome" rotulo="Nome completo" erros={erros} value={f.nome} onChange={set("nome")} autoComplete="name" maxLength={120} />
      <Campo nome="email" rotulo="E-mail" erros={erros} type="email" value={f.email} onChange={set("email")} autoComplete="email" maxLength={254}
        dica="Use o mesmo e-mail das compras, para localizarmos seus dados." />
      <Campo nome="codigoPedido" rotulo="Número do pedido" erros={erros} obrigatorio={false} value={f.codigoPedido} onChange={set("codigoPedido")} maxLength={20}
        dica="Obrigatório para desistência e trocas. Exemplo: MA-1A2B3C4D." />
      <AreaTexto nome="detalhes" rotulo="Detalhes" erros={erros} obrigatorio={false} value={f.detalhes} onChange={set("detalhes")} maxLength={3000} />
      <Armadilha valor={f.site} onChange={(v) => setF((a) => ({ ...a, site: v }))} />
      <VerificacaoHumana onToken={aoToken} />
      <BotaoAnimado type="submit" className="botao botao--hero" disabled={enviando} icone="enviar">{enviando ? "Enviando…" : "Enviar solicitação"}</BotaoAnimado>
    </form>
  );
}
