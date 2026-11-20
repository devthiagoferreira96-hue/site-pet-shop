# Segurança — Pet Shop

Situação de cada item pedido, onde está no código e o que **você** ainda precisa fazer.
Legenda: ✅ feito e testado · 🟡 feito, depende de configuração sua · ⚠️ ação manual necessária.

| # | Item | Situação | Onde |
|---|------|----------|------|
| 1 | Chave de API escondida | ✅ | Segredos só em variáveis de ambiente lidas no servidor. Nada com `NEXT_PUBLIC_` além da chave **pública** do Turnstile e do ID do Analytics. `.env` no `.gitignore`. |
| 2 | Limpar segredos do git | 🟡 | `npm run seguranca:segredos`, hook `.githooks/pre-commit` (instalado no `npm install`) e gitleaks na CI (`.github/workflows/seguranca.yml`). Ver "Se um segredo já foi commitado". |
| 3 | Chave pública do banco | ✅ | O navegador **nunca** fala com o banco: tudo passa pela API. Se usar Supabase, só a chave *publishable/anon* poderia ir ao navegador (e o RLS a bloqueia); a *service_role* nunca. |
| 4 | RLS | ✅ | `scripts/seguranca-banco.sql`: RLS em todas as tabelas, PUBLIC/anon/authenticated revogados, papéis `ma_app` e `ma_manutencao` sem BYPASSRLS. |
| 5 | Criptografar dados sensíveis | 🟡 | `src/domain/cripto.ts`: AES-256-GCM em e-mail, telefone, CPF e endereço; busca por índice cego (HMAC). Precisa de `DADOS_CHAVE`. Senhas e tokens usam hash, não cifra. |
| 6 | Autenticação no servidor | ✅ | Toda rota admin/conta verifica a sessão no banco (`exigirAdmin`/`exigirCliente`). O middleware só redireciona; quem decide é o servidor. |
| 7 | Travar acesso aos logs | ✅ | Tabela `auditoria`: o app só insere e lê; UPDATE bloqueado por trigger; DELETE só pela manutenção e só após 2 anos. Logs de erro sem parâmetros de SQL. |
| 8 | Bloquear adulteração de campos | ✅ | Schemas Zod descartam campos que não estão previstos (ex.: `preco`, `status`, `papel` enviados pelo cliente são ignorados); preço e total calculados no servidor; triggers impedem mudar valores, código e itens de pedido; CHECKs de preço/estoque/quantidade. |
| 9 | Cookies de sessão | ✅ | `HttpOnly`, `Secure`, `SameSite=Lax`, prefixo `__Host-`, token opaco (só o hash no banco), expiração e revogação. |
| 10 | Hash das senhas | ✅ | scrypt com sal por senha e comparação em tempo constante. |
| 11 | Limitar tentativas de login | ✅ | Por IP (5/15 min) **e** por conta (10/hora). Resposta idêntica para e-mail inexistente. |
| 12 | Proteção contra bots | 🟡 | Campo-armadilha sempre ativo; Cloudflare Turnstile quando `TURNSTILE_SECRET` e `NEXT_PUBLIC_TURNSTILE_SITE_KEY` estiverem definidos (grátis). |
| 13 | Queries parametrizadas | ✅ | Drizzle/postgres.js sempre com parâmetros; nenhum SQL montado com texto do usuário. |
| 14 | Validar entradas | ✅ | Zod em todas as rotas (tamanho, formato, CPF, CEP, e-mail), limite de corpo das requisições. |
| 15 | Escapar conteúdo do usuário na URL | ✅ | `encodeURIComponent` em parâmetros; links configuráveis só aceitam caminho interno; React escapa o HTML. |
| 16 | Restringir upload | ✅ | Só admin; limite de tamanho checado **antes** de ler; tipo confirmado pelo conteúdo (sharp), imagem regravada sem metadados, nome gerado pelo servidor. Planilha: só .xlsx, 6 MB. |
| 17 | Respostas enxutas | ✅ | Os serviços escolhem as colunas; hashes, ids internos e dados de outros clientes nunca saem; erros 500 sem detalhes. |
| 18 | Headers de segurança | ✅ | CSP com nonce e `strict-dynamic`, HSTS, X-Frame-Options/frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP. |
| 19 | Forçar HTTPS | ✅ | Redirecionamento 308 no middleware, HSTS de 2 anos com preload, `upgrade-insecure-requests`, cookies `Secure`. |
| 20 | Escanear dependências | 🟡 | `npm run seguranca:deps` (npm audit), Dependabot semanal e CodeQL na CI. Rode no seu computador — aqui não há internet. |

## Configuração obrigatória (.env)

1. `npm run gerar-segredos` e cole os três valores.
2. Siga a ordem do README (`db:migrate` → `db:criptografar` → `db:seguranca`).
3. Troque `DATABASE_URL` para o usuário `ma_app`. Em produção o servidor **não inicia** com o dono do banco nem sem `DADOS_CHAVE`.
4. **Guarde a `DADOS_CHAVE` em dois lugares seguros** (gerenciador de senhas). Perdeu a chave = perdeu os dados cifrados.
5. Para trocar a chave: mova a atual para `DADOS_CHAVE_ANTERIOR`, gere uma nova e rode `npm run db:criptografar`.

## Se um segredo já foi commitado

Apagar o arquivo não basta — ele continua no histórico.

1. **Troque o segredo primeiro** (senha do banco, chaves do SimplesVet/Mercado Pago etc.). Isso é o que realmente protege.
2. Limpe o histórico: `git filter-repo --path .env --invert-paths` (ou BFG) e `git push --force`.
3. Peça a quem clonou o repositório para clonar de novo.

## Testes que comprovam

- `npm run test:dominio` — senhas, tokens, validação, criptografia.
- `npm run test:api` (banco de teste) — inclui o teste 7: o banco recusa alterar valores de pedido, editar/apagar logs e preço negativo.
- Conferido manualmente com o usuário `ma_app`: pode ler e gravar, **não** pode apagar pedidos, apagar/alterar logs, criar ou derrubar tabelas. A manutenção não consegue apagar logs com menos de 2 anos.

## Pendências recomendadas

- Atualizar o Next.js para a versão de correção mais recente (`npm i next@15` e `npm audit`).
- Ativar 2FA nas contas do GitHub, hospedagem e banco.
- Backups do banco cifrados, com teste de restauração.
- Se a animação do menu (lottie) falhar com a CSP, troque o import para `lottie-web/build/player/lottie_light`.
