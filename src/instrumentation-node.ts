/**
 * Checagens de inicialização que precisam do Node (node:crypto). Importado só pelo runtime Node
 * em src/instrumentation.ts — nunca entra no pacote Edge.
 */
import { camposPendentes } from "./config/empresa";
import { chaveConfigurada } from "./domain/cripto";

export function verificarInicializacao() {
  if (process.env.NODE_ENV !== "production") return;
  const pendentes = camposPendentes();
  if (pendentes.length) {
    console.error("ERRO: preencha os dados legais da empresa no .env antes de publicar: " + pendentes.join(", "));
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("ERRO: defina DATABASE_URL."); process.exit(1); }
  if (!chaveConfigurada()) { console.error("ERRO: defina DADOS_CHAVE (criptografia dos dados pessoais). Gere com: npm run gerar-segredos"); process.exit(1); }
  // o usuário da conexão precisa ser ma_app (no Supabase pooler o formato é ma_app.<projeto>)
  if (!/^postgres(ql)?:\/\/ma_app[.:@]/.test(url)) {
    console.error("ERRO: em produção o site deve usar o papel ma_app (rode npm run db:seguranca), não o dono do banco."); process.exit(1);
  }
}
