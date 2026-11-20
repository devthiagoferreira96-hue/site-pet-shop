/**
 * Dados legais e de operação, lidos do .env. Tudo marcado "PREENCHER" é obrigatório antes de publicar
 * (Decreto 7.962/2013, art. 2º; LGPD, art. 9º e 41; Decreto 5.053/2004). Em produção o servidor não
 * inicia se faltar algum (veja src/instrumentation.ts).
 */
const PENDENTE = "PREENCHER";
const env = (nome: string, padrao = PENDENTE) => (process.env[nome] ?? "").trim() || padrao;

export const EMPRESA = {
  nomeFantasia: "Pet Shop",
  razaoSocial: env("EMPRESA_RAZAO_SOCIAL"),
  cnpj: env("EMPRESA_CNPJ"),
  endereco: env("EMPRESA_ENDERECO"),
  telefone: env("EMPRESA_TELEFONE"),
  whatsapp: env("EMPRESA_WHATSAPP", "").replace(/\D/g, ""),
  emailAtendimento: env("EMPRESA_EMAIL"),
  horario: env("EMPRESA_HORARIO"),
  encarregadoNome: env("LGPD_ENCARREGADO_NOME"),
  encarregadoEmail: env("LGPD_ENCARREGADO_EMAIL"),
  registroMapa: env("MAPA_REGISTRO_ESTABELECIMENTO"),
  rtNome: env("RT_VETERINARIO_NOME"),
  rtCrmv: env("RT_VETERINARIO_CRMV"),
  fornecedorHospedagem: env("FORNECEDOR_HOSPEDAGEM"),
  fornecedorEmail: env("FORNECEDOR_EMAIL"),
  fornecedorPagamento: env("FORNECEDOR_PAGAMENTO"),
};

export const POLITICAS = {
  versao: "1.0",
  data: env("POLITICAS_DATA", "PREENCHER (dd/mm/aaaa)"),
};

export const ENTREGA = {
  ativa: process.env.ENTREGA_ATIVA === "1",
  taxaCentavos: Math.round(Number(process.env.ENTREGA_TAXA || 0) * 100),
  area: env("ENTREGA_AREA", ""),
  prazo: env("ENTREGA_PRAZO", ""),
};

export const RETENCAO = {
  contatoDias: Number(process.env.RETENCAO_CONTATO_DIAS || 180),
  pedidosAnos: Number(process.env.RETENCAO_PEDIDOS_ANOS || 5),
};

export const GA4_ID = (process.env.NEXT_PUBLIC_GA4_ID ?? "").trim();
export const PRODUCAO = process.env.NODE_ENV === "production";

export function camposPendentes(): string[] {
  const p = Object.entries(EMPRESA).filter(([, v]) => typeof v === "string" && v.startsWith(PENDENTE)).map(([k]) => k);
  if (POLITICAS.data.startsWith(PENDENTE)) p.push("politicasData");
  return p;
}

export const freteDe = (modalidade: "retirada" | "entrega") => (modalidade === "entrega" && ENTREGA.ativa ? ENTREGA.taxaCentavos : 0);
