# Relatório de conformidade e riscos jurídicos — Site e API Pet Shop (Next.js)

> **Importante:** este relatório e os textos legais do site foram preparados por uma IA com base na legislação pesquisada em novembro de 2026. Eles reduzem bastante o risco, mas **não substituem a revisão de um advogado** (de preferência com experiência em direito do consumidor e LGPD) **e do médico-veterinário responsável técnico**. Nenhum site tem garantia de "nunca ser processado"; o objetivo aqui é cumprir a lei e deixar provas de que ela foi cumprida.

---

## 1. O que precisa ser feito ANTES de publicar (bloqueadores)

O site **se recusa a iniciar em produção** enquanto os itens marcados com ⛔ não estiverem preenchidos no `.env`.

| # | Item | Por quê | Quem resolve |
|---|------|---------|--------------|
| ⛔ 1 | Razão social, CNPJ, endereço físico, e-mail e telefone | Decreto 7.962/2013, art. 2º: obrigatório em loja virtual | Dono da loja |
| ⛔ 2 | Nome e e-mail do **Encarregado de dados (DPO)** | LGPD, art. 41. Pequenas empresas podem ter regras simplificadas (Resolução CD/ANPD nº 2/2022), mas é recomendável indicar um canal | Dono da loja |
| ⛔ 3 | **Registro do estabelecimento no MAPA** e **responsável técnico (médico-veterinário, CRMV)** | Decreto 5.053/2004: quem comercializa produto de uso veterinário precisa de registro no MAPA e de RT. Sem isso, **não venda medicamentos** (online nem na loja) | Dono + veterinário RT |
| ⛔ 4 | Nomes da hospedagem, provedor de e-mail e intermediador de pagamento | LGPD, art. 9º: informar com quem os dados são compartilhados | Desenvolvedor |
| ⛔ 5 | Data de vigência das políticas | Transparência; o aceite do cliente fica registrado com a versão | Desenvolvedor |
| 6 | **Integrar um intermediador de pagamento** (Mercado Pago, PagSeguro, Stripe, Pagar.me etc.) usando o checkout hospedado deles | Hoje o site cria o pedido e a loja envia as instruções de pagamento manualmente. **Nunca** colete dados de cartão no seu servidor (exige certificação PCI-DSS) | Desenvolvedor |
| 7 | **E-mail automático de confirmação do pedido** | Decreto 7.962/2013, art. 4º, III: confirmar imediatamente o recebimento da aceitação da oferta. Há um `TODO` em `src/server/services/pedidos.ts` | Desenvolvedor |
| 8 | Publicar com **HTTPS** | LGPD, art. 46 (segurança). Em produção os cookies só funcionam com HTTPS | Desenvolvedor |
| 9 | Guardar **logs de acesso (IP, data e hora) por 6 meses** e em ambiente seguro | Marco Civil da Internet (Lei 12.965/2014), art. 15 | Desenvolvedor (configurar Nginx/hospedagem) |
| 10 | Apagar os produtos de demonstração (SKU `DEMO-…`) | Não anunciar produtos que não existem (CDC, art. 37) | Desenvolvedor |
| 11 | Revisão de todos os textos legais por **advogado** e da página de medicamentos pelo **RT** | Segurança jurídica | Advogado / RT |

---

## 2. Medicamentos veterinários — o maior risco do projeto

**Regras implementadas no código:**

| Tipo (campo `tipo_venda`) | O que o site faz |
|---|---|
| `livre` | Aparece com preço e pode ir para o carrinho |
| `receita` | Aparece **sem preço e sem botão de compra**, com aviso "venda somente na loja física, com receita". O servidor bloqueia a adição ao carrinho mesmo que alguém tente burlar o formulário |
| `controlado` | **Nunca aparece** no site (nem na busca nem pela URL direta) |

**Validações extras:** produtos da categoria Farmácia só são salvos com o nº de registro/licença no MAPA; páginas de medicamento mostram aviso de uso veterinário e que não substituem a consulta.

**Riscos que ainda dependem da empresa:**

1. **Produtos de controle especial** — desde 02/01/2026 vale a **Portaria MAPA nº 837/2025**: a venda exige retenção da *Notificação de Receita Veterinária* emitida no sistema do MAPA (SIPEAGRO). Isso é feito no balcão, e a loja também tem relatórios semestrais a enviar ao MAPA. O RT deve classificar cada produto.
2. **Quem decide se um produto é "venda livre"** é o rótulo/bula aprovado no MAPA ("venda sob prescrição…"). O funcionário que cadastra **não deve adivinhar**: em caso de dúvida, marque `receita` e consulte o RT.
3. **Antimicrobianos (antibióticos)** — há projeto de lei aprovado em comissão na Câmara para exigir receita retida na venda de antibióticos veterinários em pet shops. **Recomendação conservadora: cadastre todo antimicrobiano como `receita`** desde já.
4. **Preço de medicamentos com receita:** optei por não exibir o preço online, por cautela quanto à publicidade de produtos sob prescrição. Confirme com o advogado/RT.
5. Não faça campanhas, banners ou textos do tipo "cura", "elimina 100%", "sem efeitos colaterais". Isso pode configurar publicidade enganosa (CDC, art. 37) e infração sanitária.

---

## 3. LGPD — o que foi feito

- **Coleta mínima (art. 6º, III):** nenhum cadastro/conta obrigatório. Pedido pede só nome, e-mail e telefone. **CPF é opcional na retirada** e obrigatório só na entrega (nota fiscal). **Endereço só na entrega.** Sem data de nascimento, gênero etc.
- **Consentimento de marketing separado**, desmarcado por padrão e opcional (art. 8º), com data registrada.
- **Registro do aceite** dos Termos (versão + data/hora) em cada pedido.
- **Formulário de direitos do titular** (art. 18) com protocolo, painel para a equipe, alerta no painel para pedidos com mais de 10 dias (prazo legal de 15 dias, art. 19).
- **Botão de anonimização** no admin para pedidos de eliminação (mantém o que a lei fiscal exige).
- **Retenção automática:** comando `npm run limpar-dados` (agende 1x por dia): apaga mensagens após 180 dias, anonimiza pedidos após 5 anos, limpa auditoria após 2 anos.
- **Autenticação (só funcionários):** site com cookie `HttpOnly`/`SameSite=Lax`/`Secure` (prefixo `__Host-` em produção) contendo só um token opaco de 256 bits; app com access token de 15 min + refresh token de 30 dias, rotativo e com detecção de reuso (roubo derruba a sessão inteira). O banco guarda só o SHA-256 dos tokens. Logout e troca de senha revogam na hora; botão "Sair de todos os outros dispositivos". Senhas com scrypt + salt; o login leva o mesmo tempo para e-mails existentes ou não. Sem JWT: tokens opacos são revogáveis e não carregam dados.
- **Dados pessoais fora do navegador:** o carrinho guarda só ids e quantidades; nome, e-mail, telefone e CPF do checkout vão direto para a API e não ficam no aparelho.
- **Segurança (art. 46):** senhas com hash, proteção CSRF, limite de tentativas de login, cabeçalhos de segurança (CSP, HSTS, X-Frame-Options), cookies `HttpOnly`/`SameSite`/`Secure`, imagens recompactadas (remove GPS/EXIF), trilha de auditoria das ações do admin, CPF mascarado nas telas.
- **Incidentes:** se houver vazamento, a comunicação à ANPD e aos titulares é obrigatória (art. 48; Resolução CD/ANPD nº 15/2024 — prazo de 3 dias úteis). Deixe um plano simples escrito: quem avisa, como, e quem é o contato.

## 4. Cookies e rastreamento

- **Nenhum script de rastreamento é carregado por padrão.** Não há Google Analytics, Meta Pixel, Hotjar etc.
- Se a loja quiser estatísticas, basta preencher `GA4_ID`: o banner aparece automaticamente com **Aceitar / Rejeitar / Personalizar com o mesmo destaque**, categorias desligadas por padrão, revogação pelo rodapé (apaga os cookies `_ga`), conforme o Guia Orientativo de Cookies da ANPD.
- Sem ferramentas opcionais, o site usa só cookies necessários (`ma_sessao`, `ma_consentimento`), que não exigem consentimento. A Política de Cookies lista todos.
- ⚠️ **Não cole scripts de terceiros direto no HTML** (pixel, chat, widget de WhatsApp de terceiros): a CSP vai bloquear de propósito. Qualquer ferramenta nova precisa passar pelo banner, entrar na Política de Cookies e ser liberada na CSP (`security.py`).

## 5. Código de Defesa do Consumidor e e-commerce

- Dados da empresa no rodapé e nos Termos (Decreto 7.962, art. 2º).
- **Resumo do pedido antes da confirmação** (art. 4º, I), com itens, valores, frete e direitos.
- **Direito de arrependimento de 7 dias** (CDC, art. 49) explicado e com formulário próprio; reembolso integral **incluindo o frete**; estorno imediato no cartão (Decreto 7.962, art. 5º).
- Garantia legal de **30 dias (não duráveis: ração, petisco, higiene, remédio) / 90 dias (duráveis)** (CDC, art. 26) e solução em 30 dias (art. 18).
- Atendimento com resposta em até 5 dias (Decreto 7.962, art. 4º, parágrafo único).
- Cláusulas evitadas por serem abusivas (CDC, art. 51): não há "não nos responsabilizamos por…", nem foro que impeça o consumidor de processar no próprio domicílio (art. 101, I).
- Preço sempre calculado no servidor (o cliente não consegue alterar o preço pelo navegador); estoque revalidado na confirmação para não vender o que não existe.

## 6. Avaliações falsas e promessas sem comprovação

- **O site não tem avaliações nem depoimentos.** Não foram criados números de clientes, selos, prêmios, "mais vendido", "melhor preço" ou "entrega mais rápida".
- Se quiserem avaliações no futuro: só de compradores reais e verificados, publicando também as negativas, sem edição do conteúdo e sem pagar por avaliação. Avaliações inventadas são publicidade enganosa (CDC, art. 37 e art. 67 — crime).
- O campo de descrição do produto no admin avisa para não prometer resultados.

## 7. Direitos autorais e imagens

- **Imagens de produtos:** o site usa ilustrações SVG criadas para o projeto (sem direitos de terceiros). Ao enviar uma foto pelo admin, é **obrigatório** informar a origem/licença e confirmar o direito de uso; isso fica salvo no banco como prova.
- **Nunca copie fotos da Petz, Gupets, Google Imagens ou de outros sites.** Use fotos próprias ou o material oficial do fabricante com autorização por escrito (e-mail serve).
- **Layout:** os sites de referência foram usados só para entender a estrutura comum de pet shops (busca, categorias, por espécie). Nenhum texto, imagem ou código deles foi copiado, e a identidade visual vem da logo da loja.
- **Logo e marca:** confirme **quem criou** a logo e guarde um documento de cessão de direitos (se foi um designer). Obras geradas só por IA têm proteção de direito autoral incerta no Brasil. O caminho mais seguro é **registrar a marca no INPI**, depois de uma busca de anterioridade nas classes 35/31/5, para evitar notificação por uso de marca alheia.
- **Fonte:** o site usa as fontes do sistema (sem Google Fonts), sem licença e sem enviar o IP do visitante ao Google.

## 8. Acessibilidade (LBI, art. 63; WCAG 2.2 AA) — auditoria realizada

Auditado na versão anterior do mesmo visual (Python), com navegador (Playwright) em 16 páginas e testes de contraste. A versão Next.js usa o mesmo CSS e a mesma marcação; repita a auditoria após `npm run dev`:

| Verificação | Resultado |
|---|---|
| Imagens com `alt` | ✅ 100%. Produtos usam o texto alternativo cadastrado (obrigatório no admin); imagens decorativas usam `alt=""` (correto: o nome do produto já está no link ao lado) |
| Campos com rótulo | ✅ 100% |
| Contraste de texto ≥ 4,5:1 | ✅ 17 combinações, menor 5,42:1 |
| Contraste de bordas/foco ≥ 3:1 | ✅ (a borda dos campos estava em 2,80:1 e foi **corrigida** para 3,64:1) |
| Navegação por teclado | ✅ "Pular para o conteúdo" é o 1º Tab; compra completa feita só com teclado; foco visível de 3px |
| Erros de formulário | ✅ Resumo no topo com links, mensagem em cada campo, foco vai ao primeiro erro |
| Diálogo de cookies | ✅ Abre e fecha pelo teclado (Esc) e devolve o foco |
| Um `h1` por página, `lang="pt-BR"`, IDs únicos | ✅ |
| Erros de JavaScript ou de CSP no console | ✅ Nenhum |

**Ainda vale fazer:** um teste manual com leitor de tela (NVDA no Windows é gratuito) e o validador do governo (ASES/eMAG) após publicar.

## 9. Integração com o SimplesVet

- Pela pesquisa feita, **o SimplesVet não oferece API pública** (a empresa foi adquirida pela Petlove em julho/2025). Por isso foi implementada a **importação da planilha de estoque** exportada do SimplesVet (.xlsx/.csv) no painel admin, ligando os produtos pelo código (SKU).
- **Não automatize o login no SimplesVet para "raspar" dados:** isso provavelmente viola o contrato de uso, expõe a senha da empresa e quebra a cada atualização. **Peça ao suporte do SimplesVet/Petlove uma integração oficial**; a importação fica isolada em `src/server/services/estoque.ts`, fácil de trocar por uma API oficial.
- Processo para não vender sem estoque: (1) importe a planilha ao menos 1x por dia; (2) ao marcar um pedido como "pago", **lance a venda no SimplesVet**; (3) pedidos aguardando pagamento são descontados automaticamente na importação.

## 10. Outros pontos de atenção

- **Nota fiscal:** confirme com o contador como emitir NF-e/NFC-e das vendas online (o SimplesVet emite notas).
- **Cancelamento automático:** pedidos sem pagamento após 2 dias úteis devem ser cancelados manualmente no painel (cancelar devolve o estoque). Automatizar isso é uma boa próxima melhoria.
- **Entrega:** desligada por padrão (`ENTREGA_ATIVA=0`). Se ligar, preencha área, taxa e prazo reais. Prazo e preço informados são obrigação contratual.
- **Senhas do admin:** mínimo de 12 caracteres. Crie um usuário por funcionário (nunca compartilhe login), para a auditoria ser útil. Considere 2FA numa próxima versão.
- **Backup** diário do banco (`instance/loja.sqlite3`), criptografado e fora do servidor.
- **Termos de uso da plataforma de hospedagem:** escolha preferencialmente servidores no Brasil (simplifica a transferência internacional de dados, LGPD art. 33).

## 11. Análise do código do projeto Lovable (nov/2026)

O visual do site foi recriado a partir do projeto Lovable "Pet Shop" (React + TanStack + Supabase/Lovable Cloud): vidro fosco, hero com foto e parallax, cards de categoria, destaques, faixa com gradiente, cores e fontes. A lógica foi refeita em Next.js + TypeScript + PostgreSQL, com uma API v1 pronta para o app. Problemas encontrados no código do Lovable e como foram tratados aqui:

| # | Problema no Lovable | Risco | Como ficou aqui |
|---|---|---|---|
| 1 | **Cadastro público aberto e "a primeira conta criada vira administradora"** (trigger `handle_first_admin`) | Crítico: se um estranho se cadastrar antes da loja, vira dono do painel | Sem cadastro público. Admin só é criado pelo comando `npm run criar-admin` no servidor |
| 2 | Senha mínima de 6 caracteres, sem limite de tentativas no app | Invasão do painel | Mínimo 12 caracteres, bloqueio após 5 tentativas, auditoria |
| 3 | **Nenhuma página legal**: sem política de privacidade, termos, trocas, cookies, CNPJ ou endereço | Decreto 7.962/2013, LGPD, CDC | Todas as páginas legais + dados da empresa obrigatórios |
| 4 | Fontes carregadas do **Google Fonts** sem aviso | Envio do IP do visitante ao Google sem consentimento | Fontes servidas pelo próprio site (public/fonts) |
| 5 | Remédio com receita mostrado **com preço**, e o exemplo "Antibiótico… medicamento controlado" | Publicidade de produto sob prescrição; confusão sobre controlados | Com receita: sem preço e sem compra. Controlados nunca aparecem |
| 6 | Promessas não comprovadas: "entrega rápida", "medicações seguras", "ração super premium", "Destaques da semana" | Publicidade enganosa (CDC, art. 37) | Textos trocados por informações verificáveis |
| 7 | Pedido pelo WhatsApp **sem registro, sem aceite de termos e sem confirmação** | Decreto 7.962, art. 4º (resumo e confirmação) | WhatsApp mantido como opção, com aviso; o checkout do site registra pedido, aceite e resumo |
| 8 | Fotos enviadas sem texto alternativo nem origem/licença; link assinado válido por 10 anos | Acessibilidade e direitos autorais | Alt obrigatório, origem/licença obrigatória, imagem recompactada sem metadados |
| 9 | Contraste: botão do WhatsApp (2,7:1) e fim do gradiente dos botões (2,2:1) | WCAG 1.4.3 / LBI | Cores escurecidas (≥ 4,5:1), testadas automaticamente |
| 10 | Menu some no celular sem alternativa; botões − e + sem rótulo; animações e parallax sem respeitar "reduzir movimento" | Acessibilidade | Menu em faixa no celular, rótulos acessíveis, parallax/animações desligam com `prefers-reduced-motion` |
| 11 | Carrinho e total calculados no navegador (localStorage) | Valor pode ser alterado pelo cliente | Preços sempre do servidor; estoque revalidado na confirmação |
| 12 | Foto do topo gerada por IA no Lovable | Baixo (os termos do Lovable dão o uso ao usuário), mas sem proteção autoral forte | Mantida; guarde o histórico do projeto Lovable como prova de origem |

Pontos positivos do Lovable que foram mantidos: regras de banco (RLS) restringindo edição a admins, separação "exige receita / visível no site", e o fluxo de pedido pelo WhatsApp.

## Fontes consultadas
- Lei 13.709/2018 (LGPD); Lei 8.078/1990 (CDC); Decreto 7.962/2013; Lei 12.965/2014 (Marco Civil); Lei 13.146/2015 (LBI)
- Decreto 5.053/2004 — https://legis.senado.leg.br/norma/407246/publicacao/15679392
- Portaria MAPA nº 837/2025 — https://www.normasbrasil.com.br/norma/portaria-837-2025_488965.html
- MAPA, Perguntas e respostas sobre controlados — https://www.gov.br/agricultura/pt-br/assuntos/insumos-agropecuarios/insumos-pecuarios/produtos-veterinarios/relatorio-de-movimentacao-de-produtos-sob-controle-especial/perguntas-e-respostas-nova-regulamentacao-de-controlados-1
- CFMV, Diretrizes do RT para produtos e serviços — https://www.cfmv.gov.br/wp-content/uploads/2025/06/Diretrizes-RT-para-Produtos-e-Servicos-_compressed-1.pdf
- Projeto de lei sobre receita de antibióticos veterinários — https://jornaldebrasilia.com.br/estilo-de-vida/noticiaanimal/comissao-aprova-receita-obrigatoria-para-antibioticos-veterinarios/
- ANPD, Guia Orientativo de Cookies — https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf
- SimplesVet sem API (GetApp) — https://www.getapp.com/industries-software/a/simplesvet/ · Aquisição pela Petlove — https://simples.vet/
