/**
 * Roda uma vez quando o servidor inicia: bloqueia a publicação sem os dados legais, sem DADOS_CHAVE
 * ou com o usuário errado do banco. O Next troca NEXT_RUNTIME na compilação; com o `if` neste formato
 * o import some do pacote Edge (que não tem node:crypto).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { verificarInicializacao } = await import("./instrumentation-node");
    verificarInicializacao();
  }
}
