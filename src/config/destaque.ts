/**
 * BANNERS DE DESTAQUE da página inicial (entre as categorias e "Nossos produtos").
 * Eles trocam sozinhos, em ordem aleatória, a cada poucos segundos; o cliente também pode usar as setas.
 * Para mudar o que aparece, edite só este arquivo.
 *
 *  - ativo:    false esconde o banner.
 *  - ate:      (opcional) data limite "AAAA-MM-DD"; depois dela o banner some sozinho (bom para campanhas).
 *  - chamada:  frase curta para chamar a atenção (aparece acima do título).
 *  - imagem:   foto dentro de public/ (ideal: horizontal, ~1400 px de largura).
 *  - href:     para onde o botão leva (ex.: "/produtos?categoria=racoes").
 *
 * IMPORTANTE: escreva só o que a loja pode cumprir. Oferta anunciada obriga a loja (Código de Defesa do Consumidor).
 * O banner de medicações fala de um cupom que AINDA vai ser implantado: deixe "ativo: false" até o cupom existir
 * (e até o site aceitar o cupom no carrinho), ou ajuste o texto.
 *
 * Fotos: Jordy Muñoz e Karsten Winegeart / Unsplash (uso livre; citar o autor é opcional, mas bem-vindo).
 */
export type Destaque = {
  id: string; ativo: boolean; ate?: string;
  selo: string; chamada?: string; titulo: string; texto: string;
  botao: string; href: string; imagem: string; imagemAlt: string;
};

export const INTERVALO_BANNERS_MS = 7000; // tempo entre uma troca automática e outra

export const DESTAQUES: Destaque[] = [
  {
    id: "racoes", ativo: true,
    selo: "Rações",
    chamada: "Seu melhor amigo merece um prato cheio!",
    titulo: "Rações para cães e gatos",
    texto: "Escolha pelo site, confirme o pedido e retire na loja.",
    botao: "Ver rações", href: "/produtos?categoria=racoes",
    imagem: "/img/destaques/racoes.webp", imagemAlt: "",
  },
  {
    id: "acessorios", ativo: true,
    selo: "Acessórios",
    chamada: "Passeio, brincadeira e muito estilo!",
    titulo: "Acessórios para o seu pet",
    texto: "Coleiras, camas, brinquedos e muito mais para o dia a dia do seu amigo.",
    botao: "Ver acessórios", href: "/produtos?categoria=acessorios",
    imagem: "/img/destaques/acessorios.webp", imagemAlt: "Dois cães vestidos com fantasias de Natal",
  },
  {
    // DESLIGADO: anunciar um cupom que ainda não existe é oferta enganosa (CDC, arts. 30 e 37).
    // Ligue (ativo: true) só quando o cupom existir e o carrinho aceitar o cupom.
    id: "medicamentos", ativo: false,
    selo: "Cupom da clínica",
    titulo: "Medicamentos com desconto usando o cupom da clínica",
    texto: "Passou em consulta na nossa clínica veterinária? Peça o seu cupom e aproveite.",
    botao: "Ver medicações", href: "/produtos?categoria=medicacoes",
    imagem: "/img/destaques/medicamentos.webp", imagemAlt: "Cachorro de olhos fechados recebendo um carinho",
  },
];

/** Só links e imagens internos do site ("/..."): impede um link "javascript:" ou para site externo por engano. */
const caminhoInterno = (u: string) => u.startsWith("/") && !u.startsWith("//") && !u.includes("\\");

export function destaquesVisiveis(agora = new Date()): Destaque[] {
  return DESTAQUES.filter((d) => {
    if (!d.ativo) return false;
    if (!caminhoInterno(d.href) || !caminhoInterno(d.imagem)) return false;
    if (!d.ate) return true;
    const fim = new Date(`${d.ate}T23:59:59`);
    return Number.isNaN(fim.getTime()) ? true : agora <= fim;
  });
}
