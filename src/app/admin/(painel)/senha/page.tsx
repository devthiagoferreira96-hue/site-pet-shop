"use client";
import { useState } from "react";
import { enviar } from "@/components/admin/useAdminApi";
import { Campo, ResumoErros } from "@/components/Campo";
import { IconeAoMontar } from "@/components/animacao/IconeAnimado";

export default function Senha() {
  const [f, setF] = useState({ atual: "", nova: "", confirma: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  return (
    <>
      <h1 className="titulo-com-icone"><IconeAoMontar nome="escudo" tamanho={36} /> Senha e sessões</h1>
      {msg && <p className="alerta alerta--sucesso" role="status">{msg}</p>}
      <form noValidate className="cartao-form glass-strong" onSubmit={async (e) => {
        e.preventDefault();
        const r = await enviar<{ mensagem: string }>("/auth/senha", "POST", f);
        if (r.dados) { setMsg(r.dados.mensagem); setErros({}); setF({ atual: "", nova: "", confirma: "" }); } else setErros(r.erro?.campos ?? { _: r.erro?.mensagem ?? "Erro." });
      }}>
        <h2>Trocar senha</h2>
        <ResumoErros erros={erros} mensagem={erros._} />
        <Campo nome="atual" rotulo="Senha atual" erros={erros} type="password" autoComplete="current-password" value={f.atual} onChange={(e) => setF({ ...f, atual: e.target.value })} />
        <Campo nome="nova" rotulo="Nova senha" erros={erros} type="password" autoComplete="new-password" minLength={12} value={f.nova} onChange={(e) => setF({ ...f, nova: e.target.value })}
          dica="Mínimo de 12 caracteres. Dica: use uma frase com palavras aleatórias." />
        <Campo nome="confirma" rotulo="Confirme a nova senha" erros={erros} type="password" autoComplete="new-password" value={f.confirma} onChange={(e) => setF({ ...f, confirma: e.target.value })} />
        <button type="submit" className="botao botao--hero">Salvar</button>
        <p className="dica mt">Trocar a senha encerra todas as suas sessões em outros computadores e no app.</p>
      </form>
      <div className="cartao-form glass-strong">
        <h2>Sessões</h2>
        <p className="dica">Esqueceu o painel aberto em outro computador ou suspeita de acesso indevido? Encerre as outras sessões (site e app).</p>
        <button type="button" className="botao botao--glass mt" onClick={async () => { const r = await enviar<{ mensagem: string }>("/auth/encerrar-outras", "POST"); setMsg(r.dados?.mensagem ?? r.erro?.mensagem ?? ""); }}>
          Sair de todos os outros dispositivos</button>
      </div>
    </>
  );
}
