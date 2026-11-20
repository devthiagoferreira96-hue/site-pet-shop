import { exigirAdmin, ok, rota } from "@/server/http";
import { camposPendentes } from "@/config/empresa";
import { resumoPainel } from "@/server/services/produtos";
import { historicoImportacoes } from "@/server/services/estoque";

export const GET = rota(async (req) => {
  await exigirAdmin(req);
  const [resumo, hist] = await Promise.all([resumoPainel(), historicoImportacoes()]);
  return ok({ resumo, dadosLegaisPendentes: camposPendentes(), ultimaImportacao: hist[0] ?? null });
});
