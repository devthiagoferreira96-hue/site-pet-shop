import { ok, rota } from "@/server/http";
import { EMPRESA, ENTREGA, POLITICAS } from "@/config/empresa";

/** Dados legais e de operação para o app exibir (rodapé, checkout, links das políticas). */
export const GET = rota(async (req) => {
  const base = req.nextUrl.origin;
  const { fornecedorEmail: _a, fornecedorHospedagem: _b, fornecedorPagamento: _c, ...publicos } = EMPRESA;
  return ok({
    empresa: publicos,
    entrega: ENTREGA,
    politicas: {
      versao: POLITICAS.versao, vigencia: POLITICAS.data,
      termos: `${base}/termos-de-uso`, privacidade: `${base}/politica-de-privacidade`, cookies: `${base}/politica-de-cookies`,
      trocas: `${base}/trocas-devolucoes-e-reembolso`, entrega: `${base}/entrega-e-retirada`, medicamentos: `${base}/medicamentos-veterinarios`,
    },
  });
});
