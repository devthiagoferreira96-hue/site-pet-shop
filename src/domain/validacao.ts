/**
 * Validações compartilhadas por site, API e (futuramente) app.
 * Os schemas Zod são a "fonte da verdade" do que a API aceita: coletamos só o necessário (LGPD, art. 6º, III).
 */
import { z } from "zod";

export const soDigitos = (t: string) => String(t ?? "").replace(/\D/g, "");

export function cpfValido(cpf: string): boolean {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const i of [9, 10]) {
    let soma = 0;
    for (let n = 0; n < i; n++) soma += Number(d[n]) * (i + 1 - n);
    if (((soma * 10) % 11) % 10 !== Number(d[i])) return false;
  }
  return true;
}

export function mascararCpf(cpf: string | null | undefined): string {
  const d = soDigitos(cpf ?? "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "";
}

const texto = (min: number, max: number, msg: string) =>
  z.string({ required_error: msg }).trim().min(min, msg).max(max, `Use no máximo ${max} caracteres.`);

/** Campos anti-robô aceitos nos formulários públicos (validados em verificarHumano). */
const antiRobo = { site: z.string().max(200).optional(), humano: z.string().max(4096).optional() };

export const emailSchema = z
  .string({ required_error: "Informe um e-mail válido, por exemplo nome@exemplo.com." })
  .trim()
  .toLowerCase()
  .max(254)
  .email("Informe um e-mail válido, por exemplo nome@exemplo.com.");

export const telefoneSchema = z
  .string({ required_error: "Informe um telefone com DDD." })
  .transform(soDigitos)
  .refine((d) => d.length >= 10 && d.length <= 13, "Informe um telefone com DDD, por exemplo (11) 91234-5678.");

export const itemCarrinhoSchema = z.object({
  produtoId: z.number().int().positive(),
  quantidade: z.number().int().min(1).max(20),
});

export const cotacaoSchema = z.object({
  itens: z.array(itemCarrinhoSchema).min(1, "Carrinho vazio.").max(50),
  modalidade: z.enum(["retirada", "entrega"]).default("retirada"),
});

/** Pedido: o cliente NUNCA envia preço; o servidor calcula tudo a partir do banco. */
export const pedidoSchema = z
  .object({
    nome: texto(3, 120, "Informe seu nome completo."),
    email: emailSchema,
    telefone: telefoneSchema,
    modalidade: z.enum(["retirada", "entrega"], { errorMap: () => ({ message: "Escolha uma forma de recebimento válida." }) }),
    cpf: z.string().optional().default("").transform(soDigitos),
    endereco: z.string().optional().default("").transform((s) => s.trim().slice(0, 300)),
    aceiteTermos: z.literal(true, { errorMap: () => ({ message: "Para concluir, é preciso aceitar os Termos de Uso e a Política de Trocas." }) }),
    termosVersao: z.string().min(1).max(20),
    marketing: z.boolean().optional().default(false),
    itens: z.array(itemCarrinhoSchema).min(1, "Carrinho vazio.").max(50),
    ...antiRobo,
  })
  .superRefine((p, ctx) => {
    if (p.modalidade === "entrega") {
      if (!cpfValido(p.cpf)) ctx.addIssue({ code: "custom", path: ["cpf"], message: "Para entrega, o CPF é necessário para emitir a nota fiscal. Verifique os números." });
      if (p.endereco.length < 10) ctx.addIssue({ code: "custom", path: ["endereco"], message: "Informe o endereço completo com número, bairro e CEP." });
    } else if (p.cpf && !cpfValido(p.cpf)) {
      ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF inválido. Deixe em branco se não quiser CPF na nota." });
    }
  })
  .transform((p) => ({ ...p, endereco: p.modalidade === "entrega" ? p.endereco : "", cpf: p.cpf || "" }));

export const contatoSchema = z.object({
  nome: texto(2, 120, "Informe seu nome."),
  email: emailSchema,
  assunto: texto(3, 150, "Informe o assunto."),
  mensagem: texto(10, 3000, "Escreva sua mensagem (entre 10 e 3000 caracteres)."),
  ...antiRobo, // "site" = campo-armadilha: pessoas não preenchem
});

export const TIPOS_SOLICITACAO = {
  lgpd_acesso: "Confirmar se tratamos meus dados / acessar meus dados",
  lgpd_correcao: "Corrigir dados incompletos, inexatos ou desatualizados",
  lgpd_eliminacao: "Eliminar meus dados",
  lgpd_portabilidade: "Portabilidade dos meus dados",
  lgpd_revogacao: "Revogar consentimento (ex.: e-mails promocionais)",
  lgpd_outro: "Outra solicitação sobre meus dados",
  arrependimento: "Desistir da compra (direito de arrependimento – 7 dias)",
  troca: "Troca ou devolução por defeito/problema",
} as const;
export type TipoSolicitacao = keyof typeof TIPOS_SOLICITACAO;

export const solicitacaoSchema = z
  .object({
    tipo: z.enum(Object.keys(TIPOS_SOLICITACAO) as [TipoSolicitacao, ...TipoSolicitacao[]], {
      errorMap: () => ({ message: "Escolha o tipo de solicitação." }),
    }),
    nome: texto(2, 120, "Informe seu nome."),
    email: emailSchema,
    codigoPedido: z.string().trim().max(20).optional().default(""),
    detalhes: z.string().trim().max(3000, "Use no máximo 3000 caracteres.").optional().default(""),
    ...antiRobo,
  })
  .superRefine((s, ctx) => {
    if ((s.tipo === "arrependimento" || s.tipo === "troca") && !s.codigoPedido)
      ctx.addIssue({ code: "custom", path: ["codigoPedido"], message: "Informe o número do pedido (ex.: MA-1A2B3C4D)." });
  });

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1).max(200),
});

export const SENHA_MIN = 12;
export const novaSenhaSchema = z
  .object({ atual: z.string().min(1), nova: z.string().min(SENHA_MIN, `A nova senha precisa ter pelo menos ${SENHA_MIN} caracteres.`).max(200), confirma: z.string() })
  .refine((s) => s.nova === s.confirma, { path: ["confirma"], message: "A confirmação não confere." });

/** Converte erros do Zod em { campo: mensagem } — formato usado pela API e pelos formulários. */
export function errosPorCampo(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const campo = issue.path.join(".") || "_";
    if (!out[campo]) out[campo] = issue.message;
  }
  return out;
}
