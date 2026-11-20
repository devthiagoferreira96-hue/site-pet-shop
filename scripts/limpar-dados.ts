/** Política de retenção (LGPD, arts. 15 e 16). Agende 1x por dia (cron, agendador da hospedagem etc.). */
import { aplicarRetencao } from "@/server/services/atendimento";

console.log(await aplicarRetencao());
process.exit(0);
