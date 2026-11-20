"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/api-cliente";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function entrar(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true); setErro("");
    const r = await api("/auth/login", { corpo: { email, senha } });
    setEnviando(false);
    if (r.dados) router.replace("/admin"); else { setErro(r.erro?.mensagem ?? "Não foi possível entrar."); setSenha(""); }
  }
  return (
    <main id="conteudo" className="cartao-form glass-strong">
      <h1>Entrar no painel</h1>
      {erro && <p className="alerta alerta--erro" role="alert">{erro}</p>}
      <form onSubmit={entrar}>
        <div className="campo"><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="campo"><label htmlFor="senha">Senha</label><input id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        <button type="submit" className="botao botao--hero" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
      </form>
      <p className="dica mt">Acesso restrito a funcionários autorizados. As ações no painel são registradas.</p>
    </main>
  );
}
