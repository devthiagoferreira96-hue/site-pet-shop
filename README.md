# 🐾 Pet Shop — loja online + API (Next.js, TypeScript, PostgreSQL)

> Projeto de portfólio. Nome da loja, logo e dados da empresa são fictícios; os produtos do seed são de demonstração.

Loja online de pet shop (rações, acessórios e medicações) com **retirada na loja ou entrega**, painel administrativo e uma **API REST v1** pronta para um app mobile. O foco do projeto foi fazer do jeito certo: segurança, LGPD, regras de venda de medicamentos, acessibilidade e testes.

| Camada | Tecnologia |
|---|---|
| Front-end e back-end | **Next.js 15** (App Router, Server Components) + **React 19** + **TypeScript** |
| Banco | **PostgreSQL** com **Drizzle ORM**, RLS e papéis separados (app × manutenção) |
| Validação | **Zod** |
| Animações | Motion + lucide-animated, respeitando "reduzir movimento" |
| Testes | testes de domínio (sem banco) e de API (com banco de teste) |
| Ambiente | Docker Compose para o Postgres local |

**Destaques**
- Mesma API e mesmas regras para o site e para o app: o preço sempre vem do banco, o estoque é revalidado na confirmação, medicamento com receita não entra no carrinho e controlados nunca aparecem.
- Autenticação própria: sessão com cookie `HttpOnly`/`__Host-` no site; access token de 15 min + refresh rotativo com detecção de reuso no app.
- Dados pessoais **criptografados no banco**, logs imutáveis, CSP com nonce, proteção CSRF, limite de envios e retenção automática de dados (LGPD).
- Documentação de [API](docs/API.md), [segurança](docs/SEGURANCA.md), [design system](docs/DESIGN-SYSTEM.md) e [conformidade jurídica](docs/RELATORIO-JURIDICO-E-CONFORMIDADE.md).

---

Site da loja e **API v1 pronta para o app**. Visual definido pelo design system em [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) (superfícies chapadas, Fraunces + Figtree, petróleo do logo como cor de ação), com as correções legais, de segurança e de acessibilidade.

> **Leia antes de publicar:** [`docs/RELATORIO-JURIDICO-E-CONFORMIDADE.md`](docs/RELATORIO-JURIDICO-E-CONFORMIDADE.md)
> **Para quem for fazer o app:** [`docs/API.md`](docs/API.md)

## Arquitetura

```
src/
  domain/      regras puras (sem framework): preços, medicamentos, validação (Zod), senhas, tokens, planilha
  server/      serviços (banco) + utilitários HTTP. Única fonte da verdade das regras.
  app/
    (loja)/    páginas públicas (servidor chama os serviços direto; partes interativas chamam a API)
    admin/     painel (sessão validada no servidor em toda página)
    api/v1/    API REST usada pelo site E pelo app
  components/  componentes React (carrinho, checkout, formulários acessíveis, cookies)
  db/          esquema Drizzle (PostgreSQL)
```

Site e app usam **a mesma API e as mesmas regras**: medicamento com receita não vai para o carrinho, controlados nunca aparecem, o preço sempre vem do banco e o estoque é revalidado na confirmação.

## Rodando no seu computador

Pré-requisitos: Node 20.9 ou mais novo e Docker (para o PostgreSQL), ou um Postgres instalado.

```bash
npm install
npm run icones                     # baixa os ícones animados oficiais do lucide-animated (obrigatório)
cp .env.example .env               # Windows: copy .env.example .env
npm run gerar-segredos             # cole DADOS_CHAVE, DB_SENHA_APP e DB_SENHA_MANUTENCAO no .env
docker compose up -d               # sobe o PostgreSQL local (Docker Desktop aberto)
npm run db:generate                # gera a migração a partir de src/db/schema.ts
npm run db:migrate                 # cria/atualiza as tabelas
npm run db:criptografar            # cifra dados pessoais que já existiam (pode rodar de novo sem problema)
npm run db:seguranca               # cria os papéis ma_app/ma_manutencao, liga o RLS, travas e logs imutáveis
#  → no .env: DATABASE_ADMIN_URL = a URL do dono (a antiga), DATABASE_URL = URL com o usuário ma_app,
#    DATABASE_MANUTENCAO_URL = URL com o usuário ma_manutencao (veja .env.example)
npm run db:seed-demo               # categorias + 9 produtos FICTÍCIOS (use db:seed para só categorias)
npm run criar-admin                # cria o administrador (não existe cadastro público de admin)
npm run db:verificar               # confere banco, tabelas, chave e admin, e diz o que falta
npm run dev
```

Loja: http://localhost:3000 · Painel: http://localhost:3000/admin

## Testes

- `npm run test:dominio`: regras de negócio, validações, senhas, tokens e planilha. **Não precisa de banco.**
- `npm run test:api`: serviços com um banco de **teste** (o nome do banco precisa conter "test"). Cobre pedido, estoque, medicamentos e o ciclo completo de tokens (rotação, reuso, logout, troca de senha).
- `npm run lint`: checagem de tipos do TypeScript.

## Segurança (resumo)

Detalhes, item por item, em [docs/SEGURANCA.md](docs/SEGURANCA.md). Antes de cada commit rode `npm run seguranca`.

- **Admin:** criado só pelo terminal, senha com scrypt e no mínimo 12 caracteres, limite de 5 tentativas, auditoria das ações.
- **Site:** cookie `HttpOnly` + `SameSite=Lax` + `Secure` (`__Host-` em produção), com um token opaco; a sessão fica no banco (só o hash).
- **App:** access token de 15 min + refresh rotativo de 30 dias, com detecção de reuso. Sem JWT e sem dados dentro do token.
- **Proteções extras:** checagem de origem (CSRF) nas rotas com cookie; CSP com nonce em `src/middleware.ts` e cabeçalhos em `next.config.ts`; limite de envios nos formulários públicos.
- **Dados mínimos:** o carrinho no aparelho guarda só ids; os dados do checkout não ficam no navegador; retenção automática com `npm run limpar-dados`.

## Publicando

1. Hospedagem com Node (Vercel, Render, Railway, VPS) + PostgreSQL gerenciado (Neon, Supabase, RDS…), de preferência com servidores no Brasil.
2. `.env` de produção com `DATABASE_URL` (usuário **ma_app**), `DADOS_CHAVE`, `DATABASE_SSL=1` e **todos** os dados legais. Sem eles o servidor não inicia (`src/instrumentation.ts`).
3. `npm run build && npm start` (ou o deploy da plataforma). Defina `CONFIAR_PROXY=1` se estiver atrás de proxy.
4. Uploads: `UPLOAD_DIR` precisa ser um disco persistente. Em plataformas sem disco, como a Vercel, troque `src/server/services/imagens.ts` por um armazenamento de objetos (S3, R2).
5. Agende `npm run limpar-dados` uma vez por dia e o backup do banco.
6. Guarde os logs de acesso por 6 meses (Marco Civil).

## Animações

- **Ícones animados:** [lucide-animated](https://lucide-animated.com) (MIT), baixados com `npm run icones` para `src/components/icons/`. A lista fica em `src/components/animacao/icones-lista.json` e o mapeamento em `src/components/animacao/icones.ts`.
- **Quando animam:** os ícones animam no hover **e no foco do teclado** do botão ou link inteiro, ao aparecer na tela (faixa, destaques, rodapé) ou ao confirmar uma ação (item adicionado, pedido recebido).
- **Entradas suaves ao rolar:** feitas com Motion (`Revelar`) em cards, painéis, páginas legais e rodapé.
- **Hero:** duas colunas (texto + foto emoldurada), sem parallax nem enfeites flutuando.
- **Reduzir movimento:** tudo respeita essa opção do sistema (`MotionConfig reducedMotion="user"` + CSS). Quem usa fica só com o esmaecer, sem deslocamentos.
- Ícones que o lucide-animated não tem (pata, loja, receita) continuam como SVG estático em `src/components/Icone.tsx`.

## Problemas comuns

- **"Failed query: select … from categorias"**: as tabelas não foram criadas ou o banco não está rodando. Rode `npm run db:verificar`, que diz qual dos dois.
- **Erro de import em `@/components/icons/...`**: faltou rodar `npm run icones`.
- **"In HTML, `<div>` cannot be a descendant of `<p>`" / "Hydration failed"**: os ícones estão com `<div>` por fora. Rode `npm run icones:ajustar` (troca por `<span>` sem baixar de novo), apague a pasta `.next` e reinicie o `npm run dev`. O `npm run icones` já faz esse ajuste sozinho.

## Fontes e design system

Fraunces (títulos) e Figtree (texto) já estão em `public/fonts` (licença OFL, servidas pelo próprio site, sem Google Fonts). Cores, tipografia, espaçamento e regras de componentes: [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

## Próximos passos

- **Pagamento:** checkout hospedado de um intermediador + webhook que marca o pedido como "pago" (nunca colete dados de cartão no servidor).
- **E-mail de confirmação do pedido:** obrigatório pelo Decreto 7.962/2013. Há um TODO em `src/server/services/pedidos.ts`.
- **App:** Expo + React Native consumindo `docs/API.md`.
