# Design System — Pet Shop (v2 "Bairro")

O objetivo é que o site pareça uma **loja de verdade, com dono e endereço**, e não um template gerado por IA.
Tudo o que está aqui já está implementado em `src/app/globals.css`, como tokens em `:root`.

## Por que mudou (diagnóstico da v1)

A primeira versão veio de um projeto Lovable e tinha todos os sinais de "site de IA":

| Sinal de amadorismo / IA | O que tinha | O que ficou |
|---|---|---|
| Vidro fosco em tudo (glassmorphism) | cards, cabeçalho, rodapé e botões translúcidos com blur; "liquid glass" com refração SVG | superfícies chapadas: branco + borda de 1px. O vidro ficou em **um** lugar: o cabeçalho sobre a foto da capa |
| Gradientes decorativos | fundo com 3 manchas radiais, texto em gradiente, botões em gradiente com "glow" | fundo neutro azulado liso, cores sólidas |
| Enfeites flutuando | patinhas e ossos girando, bolhas desfocadas, parallax | nenhum enfeite; a foto e o produto são o enfeite |
| Tudo em pílula e muito arredondado | raio de 20 a 32px em cards e botões | raio de 6 a 24px, conforme o tamanho do elemento |
| Marca repetida no hero | logo gigante + nome da loja + véu branco + cartão de vidro com outro título | foto de ponta a ponta mantida; marca só no cabeçalho; uma mensagem num painel sólido |
| Fotos de fundo atrás dos cards | cada fileira do carrossel com foto da categoria por trás de cards de vidro | fileiras limpas; a foto da categoria vira um ícone pequeno no título |
| Fontes não carregavam | Fredoka/Nunito não estavam instaladas, e o site caía no Segoe UI | Fraunces + Figtree, instaladas em `public/fonts` |
| Cor de marca em todo lugar | preço, títulos, links, chips e botões em petróleo | petróleo só para ação (botão, link); preço e títulos em tinta escura |

## Princípios

1. **Chapado e honesto.** Uma superfície é branca com borda. A sombra só aparece para indicar elevação (hover, diálogo, painel da capa).
   **Exceção única: vidro.** O cabeçalho fica de vidro fosco *apenas* enquanto está sobre a foto da capa (`.topo--vidro`, ligado pelo script). Ao rolar, ele vira a barra sólida. Vidro só funciona com uma imagem rica atrás; sobre fundo liso ele vira cinza embaçado.
2. **Uma cor de ação.** O petróleo do logo (`--brand`) indica o que é clicável. O laranja (`--accent`) é tempero: contador do carrinho, traço do *eyebrow*, avisos.
3. **Tipografia com personalidade.** Os títulos usam uma serifada macia (Fraunces), que dá o tom acolhedor sem ficar infantil. O texto usa uma sans clara (Figtree).
4. **O conteúdo manda.** Foto de produto, preço e nome vêm primeiro. Nada compete com eles.
5. **Movimento discreto.** Transições de 150 a 250ms em cor e borda. Nada flutua nem fica girando. "Reduzir movimento" desliga tudo.

## Cores

### Neutros (azulados, puxados do petróleo do logo)
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#F3F8F8` | fundo da página |
| `--surface` | `#FFFFFF` | cards, painéis, campos |
| `--surface-2` | `#E7F0F0` | faixas ("Como funciona", banners), fundo de foto |
| `--surface-3` | `#DAE7E7` | hover em áreas `surface-2` |
| `--ink` | `#17292D` | texto principal, preço, chip ativo, rodapé |
| `--ink-2` | `#55625F` | texto secundário, legendas |
| `--line` | `#D6E3E2` | bordas de cards e divisórias |
| `--line-strong` | `#7C8683` | borda de campos e botão secundário (contraste ≥ 3:1) |

### Marca
| Token | Hex | Uso |
|---|---|---|
| `--brand` | `#0F6B7A` | botão primário, links, foco |
| `--brand-hover` | `#0B5763` | hover do primário |
| `--brand-soft` / `--brand-ink` | `#E2F0F1` / `#0A4A54` | selo de categoria, caixa de informação |
| `--accent` | `#E8892B` | contador do carrinho, traço do *eyebrow* (só decorativo) |
| `--accent-soft` / `--accent-ink` | `#FCEBD6` / `#7F4208` | avisos de receita, chamada de banner |

### Estados
`--success #1F7A45`, `--danger #B42318`, `--warning-soft #FEF3E2` com `--warning-ink #6E4300`, e `--whatsapp #1E7D40`.

**Contraste medido (WCAG 2.2 AA):** `--ink`/`--bg` 14.1:1 · `--ink-2`/`--bg` 5.9:1 · `--ink-2`/`--surface-2` 5.5:1 · branco/`--brand` 6.2:1 · `--brand`/`--bg` (link) 5.8:1 · `--accent-ink`/`--accent-soft` 6.7:1 · `--brand-ink`/`--brand-soft` 8.5:1 · `--line-strong`/branco 3.8:1 (3.5:1 sobre `--bg`) (borda de componente, mínimo 3:1) · rodapé: texto 9.9:1 e títulos 6.5:1 sobre `--ink`. **Nunca** use `--accent` como cor de texto sobre fundo claro.

## Tipografia

| Papel | Fonte | Peso | Tamanho |
|---|---|---|---|
| Display (h1 do hero) | Fraunces | 600 | `--fs-5xl` (40 → 60px) |
| Título de seção / página (h1, h2) | Fraunces | 600 | `--fs-4xl` (32 → 40px) |
| Subtítulo (h3, nome de categoria) | Figtree | 700 | 18–20px |
| Texto | Figtree | 400 | 16px / 1.6 |
| Texto secundário | Figtree | 400–600 | 14–15px, `--ink-2` |
| Eyebrow (rótulo acima de título) | Figtree | 700, CAIXA ALTA, +0.1em | 12px, `--brand` |
| Preço | Figtree | 750, números tabulares | 20px (card) / 32px (produto) |

- Fraunces usa `"SOFT" 60` (cantos macios) e tamanho óptico automático.
- **Só h1 e h2 usam a serifada.** h3, h4, botões, preços e o admin usam Figtree.
- As fontes ficam em `public/fonts` (licença OFL), sem Google Fonts, por causa da LGPD.

## Espaço, forma e sombra

- **Espaço** (base 4px): `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 · `--s-8` 64 · `--s-9` 96. Entre seções da home, use `--s-9`.
- **Raio:** `--r-sm` 6px (selos, chips de categoria) · `--r-md` 10px (botões, campos) · `--r-lg` 16px (cards) · `--r-xl` 24px (hero, banners, foto de produto) · `--r-full` (só chips de filtro e contador).
- **Sombra:** `--shadow-1` (repouso, quase invisível) · `--shadow-2` (hover de card, foto do hero) · `--shadow-3` (diálogo, banner de cookies).
- **Largura do conteúdo:** `--largura` = até 1200px, com 16px de margem lateral no celular.

## Componentes

| Componente | Classe | Regra |
|---|---|---|
| Botão primário | `.botao.botao--primario` (ou `--hero`) | fundo `--brand`, texto branco; **um por área** |
| Botão secundário | `.botao.botao--secundario` (ou `--glass`) | branco, borda `--line-strong`, texto `--ink` |
| Botão no card | `.card .botao--hero` | contorno `--brand`, que fica cheio no hover (a grade não vira um mar de botões cheios) |
| Card | `.card.glass` / `.superficie` | branco, borda `--line`, `--r-lg`; no hover, borda mais forte + `--shadow-2` (sem pular) |
| Eyebrow | `.eyebrow` | rótulo curto acima de um h1/h2, com traço laranja |
| Selo | `.selo-cat`, `.selo-topo` | `--brand-soft`, caixa alta, `--r-sm` |
| Chip de filtro | `.chip` | pílula branca; ativo = `--ink` cheio |
| Aviso de receita | `.aviso-receita`, `.caixa-receita` | `--accent-soft` + `--accent-ink` |
| Campos | `input`, `select`, `textarea` | borda `--line-strong`, `--r-md`; foco = borda `--brand` + anel de 3px |
| Cabeçalho | `.topo` | barra de ponta a ponta, borda inferior; marca à esquerda, busca no centro, carrinho à direita. Sobre a capa: `.topo--vidro` |
| Capa | `.hero.hero--imersivo` | foto de ponta a ponta passando por baixo do cabeçalho (`--topo-h`); texto num painel branco com `--shadow-3`. No celular, a foto fica em cima e o painel sobe sobre ela |
| Rodapé | `.rodape` | faixa `--ink` de ponta a ponta, títulos em caixa alta pequena |

> **Nomes antigos:** `.glass`, `.glass-strong` e `.glass-dark` continuam existindo para não quebrar telas (admin, formulários, páginas legais), mas agora são superfícies chapadas. Em código novo, use `.superficie`.

## Faça / Não faça

**Faça**
- Uma mensagem por bloco: eyebrow → título → texto curto → ação.
- Fotos reais de produto em fundo neutro (o placeholder "Foto em breve" é provisório).
- Alinhar tudo à grade de 1200px.

**Não faça**
- `backdrop-filter` fora do cabeçalho da capa, gradiente em texto, botão com "glow", manchas desfocadas.
- Texto direto sobre a foto (sem painel) ou véu branco por cima da foto.
- Ícones decorativos soltos (patinha flutuando, brilho ✨ ao lado de título).
- Mais de uma cor de destaque no mesmo bloco.
- Prometer o que a loja não cumpre ("entrega rápida", "o melhor preço"): o Código de Defesa do Consumidor vale para anúncio.

## Próximos passos de visual (não são de código)

1. **Fotos dos produtos.** É o que mais falta: os cards com "Foto em breve" deixam o catálogo com cara de site em construção.
2. **Dados reais da empresa** no `.env`: endereço, telefone e CNPJ aparecem no rodapé e na página de produto.
3. **Logo em vetor (SVG).** O logo atual é PNG/WebP. Em SVG ele fica nítido no cabeçalho em qualquer tela.
