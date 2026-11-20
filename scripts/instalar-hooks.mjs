/** Ativa os ganchos do Git em .githooks (roda sozinho no npm install). Não falha se não for um repositório Git. */
import { execFileSync } from "node:child_process";
try {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" });
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
  console.log("✓ Gancho de pre-commit ativado (bloqueia commits com segredos).");
} catch { /* não é um repositório Git (ou git não instalado): nada a fazer */ }
