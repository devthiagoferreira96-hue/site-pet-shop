/**
 * Procura segredos (senhas, chaves, tokens) em arquivos que podem ir para o Git.
 *   npm run seguranca:segredos            -> varre o projeto (ignora .env, node_modules, .next, uploads)
 *   (o gancho de pre-commit roda isto só nos arquivos que você está commitando)
 * Sai com erro se achar algo, para o commit/CI parar. Os valores encontrados NÃO são impressos.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const REGRAS = [
  ["Chave privada", /-----BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/],
  ["Chave AWS", /\bAKIA[0-9A-Z]{16}\b/],
  ["Chave Google", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Token Stripe", /\b(sk|rk)_(live|test)_[0-9A-Za-z]{16,}\b/],
  ["Token Mercado Pago", /\b(APP_USR|TEST)-\d{10,}-\d{6}-[0-9a-f]{32}-\d+\b/],
  ["Token GitHub", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ["Token Slack", /\bxox[abpr]-[A-Za-z0-9-]{10,}\b/],
  ["JWT (ex.: chave service_role do Supabase)", /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ["URL de banco com senha", /\bpostgres(ql)?:\/\/[^\s:@/'"`]+:(?!<|\$\{|troque-esta-senha-local@)[^\s@'"`]{6,}@/i],
  ["Segredo do projeto no código", /\b(DADOS_CHAVE|DB_SENHA_APP|DB_SENHA_MANUTENCAO|TURNSTILE_SECRET)\s*[=:]\s*['"]?[A-Za-z0-9+/_=-]{16,}/],
];
const IGNORAR_PASTAS = new Set(["node_modules", ".next", ".git", "uploads", "drizzle"]);
const IGNORAR_ARQUIVOS = /(^|\/)\.env(\.(?!example$)[^/]*)?$|\.(png|jpe?g|webp|avif|gif|ico|woff2?|zip|lock)$|package-lock\.json$/;

function arquivosDoGit() {
  try {
    const args = process.argv.includes("--staged") ? ["diff", "--cached", "--name-only", "--diff-filter=ACM"] : ["ls-files"];
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
  } catch { return null; } // não é um repositório Git
}
function todosOsArquivos(dir = ".", lista = []) {
  for (const nome of readdirSync(dir)) {
    const p = path.join(dir, nome);
    if (statSync(p).isDirectory()) { if (!IGNORAR_PASTAS.has(nome)) todosOsArquivos(p, lista); }
    else lista.push(p);
  }
  return lista;
}

const arquivos = (arquivosDoGit() ?? todosOsArquivos()).map((f) => f.split(path.sep).join("/")).filter((f) => !IGNORAR_ARQUIVOS.test(f));
const achados = [];
for (const f of arquivos) {
  let texto;
  try { texto = readFileSync(f, "utf8"); } catch { continue; }
  if (texto.includes("\u0000")) continue; // binário
  texto.split("\n").forEach((linha, i) => {
    for (const [tipo, re] of REGRAS) if (re.test(linha)) achados.push(`${f}:${i + 1}  ${tipo}`);
  });
}
// .env nunca pode estar no Git
const envNoGit = (arquivosDoGit() ?? []).filter((f) => /(^|\/)\.env(\.(?!example$).*)?$/.test(f));
for (const f of envNoGit) achados.push(`${f}  arquivo .env está no Git (remova com: git rm --cached ${f})`);

if (achados.length) {
  console.error("✗ Possíveis segredos encontrados (valores ocultos):\n  " + achados.join("\n  "));
  console.error("\nTire o segredo do arquivo (use o .env) e TROQUE a senha/chave: o que já foi para o Git deve ser considerado vazado.");
  console.error("Falso positivo? Ajuste as regras em scripts/verificar-segredos.mjs.");
  process.exit(1);
}
console.log(`✓ Nenhum segredo encontrado em ${arquivos.length} arquivo(s).`);
