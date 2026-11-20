import { NextResponse } from "next/server";
import { definirCookieSessao, erro, ipDe, lerJson, rota } from "@/server/http";
import { loginSchema } from "@/domain/validacao";
import { PRAZOS } from "@/domain/seguranca";
import { criarSessaoWeb, limiteLogin, limiteLoginConta, verificarLogin } from "@/server/services/auth";
import { auditar } from "@/server/services/auditoria";

/** Login do painel no SITE: cria sessão no servidor e devolve cookie HttpOnly (o token nunca vai no corpo). */
export const POST = rota(async (req) => {
  const chave = `login:${ipDe(req)}`;
  if (limiteLogin.excedido(chave)) return erro(429, "Muitas tentativas. Aguarde 15 minutos e tente novamente.");
  const { email, senha } = await lerJson(req, loginSchema);
  const conta = `conta:${email}`;
  if (limiteLoginConta.excedido(conta)) return erro(429, "Muitas tentativas para esta conta. Aguarde 1 hora ou fale com o responsável.");
  const admin = await verificarLogin(email, senha);
  if (!admin) { limiteLogin.registrar(chave); limiteLoginConta.registrar(conta); return erro(401, "E-mail ou senha incorretos."); }
  limiteLogin.limpar(chave); limiteLoginConta.limpar(conta);
  const token = await criarSessaoWeb(admin.id); // token novo a cada login (evita fixação de sessão)
  await auditar(admin.id, "login", "web");
  const res = NextResponse.json({ dados: { nome: admin.nome, email: admin.email } }, { headers: { "Cache-Control": "no-store" } });
  definirCookieSessao(res, token, PRAZOS.sessaoWebAdminMs / 1000);
  return res;
});
