import { erro, ipDe, lerJson, ok, rota } from "@/server/http";
import { loginSchema } from "@/domain/validacao";
import { emitirTokensApp, limiteLogin, limiteLoginConta, verificarLogin } from "@/server/services/auth";
import { auditar } from "@/server/services/auditoria";

/**
 * Login do APP: devolve accessToken (15 min) + refreshToken (30 dias).
 * No app, guarde os dois no armazenamento seguro (expo-secure-store: Keychain/Keystore), nunca em AsyncStorage.
 */
export const POST = rota(async (req) => {
  const chave = `login:${ipDe(req)}`;
  if (limiteLogin.excedido(chave)) return erro(429, "Muitas tentativas. Aguarde 15 minutos e tente novamente.");
  const { email, senha } = await lerJson(req, loginSchema);
  const conta = `conta:${email}`;
  if (limiteLoginConta.excedido(conta)) return erro(429, "Muitas tentativas para esta conta. Aguarde 1 hora ou fale com o responsável.");
  const admin = await verificarLogin(email, senha);
  if (!admin) { limiteLogin.registrar(chave); limiteLoginConta.registrar(conta); return erro(401, "E-mail ou senha incorretos."); }
  limiteLogin.limpar(chave); limiteLoginConta.limpar(conta);
  await auditar(admin.id, "login", "app");
  return ok({ ...(await emitirTokensApp(admin.id)), admin: { nome: admin.nome, email: admin.email } });
});
