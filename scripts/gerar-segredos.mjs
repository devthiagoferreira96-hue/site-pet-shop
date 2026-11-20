/**
 * Gera segredos fortes para o .env (rode e COPIE para o .env; nada é salvo em arquivo).
 * Uso: npm run gerar-segredos
 */
import { randomBytes } from "node:crypto";

const senha = () => randomBytes(32).toString("base64url"); // 43 caracteres: letras, números, - e _
console.log(`# --- cole no seu .env (NUNCA no Git) ---
DADOS_CHAVE=${randomBytes(32).toString("base64")}
DB_SENHA_APP=${senha()}
DB_SENHA_MANUTENCAO=${senha()}
# Guarde uma cópia da DADOS_CHAVE em um cofre de senhas: sem ela, os dados cifrados não podem ser lidos.`);
