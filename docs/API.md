# API v1 — Pet Shop

API REST usada pelo site e pronta para o app (React Native / Expo). Todas as regras de negócio ficam **no servidor**: o app não precisa (nem deve) reimplementar regras de preço, estoque ou medicamentos.

- **Base:** `https://SEU-DOMINIO/api/v1`
- **Formato:** JSON (`Content-Type: application/json`), exceto uploads (`multipart/form-data`).
- **Sucesso:** `{ "dados": ... }`
- **Erro:** `{ "erro": { "mensagem": "texto para mostrar ao usuário", "campos": { "email": "..." } } }`
- **Dinheiro:** sempre em **centavos** (inteiro). `8990` = R$ 89,90.
- **Versão:** mudanças incompatíveis vão para `/api/v2`. O app pode continuar usando a v1.

| Código | Quando |
|---|---|
| 200 / 201 | Sucesso |
| 400 | JSON inválido |
| 401 | Não autenticado / token expirado (no app: tente `/auth/refresh`) |
| 403 | Origem não permitida (só afeta o site, que usa cookie) |
| 404 | Não encontrado |
| 409 | Conflito de estoque ou termos desatualizados (mostre a mensagem e recarregue a cotação) |
| 413 | Arquivo grande demais |
| 422 | Campos inválidos (veja `erro.campos`) |
| 429 | Muitas tentativas (aguarde) |

---

## 1. Rotas públicas (loja)

### `GET /loja`
Dados legais da empresa, entrega e **links das políticas**. O app deve mostrar esses links no checkout e no menu, e enviar `politicas.versao` como `termosVersao` ao criar o pedido.

### `GET /categorias`
`[{ "nome": "Rações", "slug": "racoes", "emoji": "🍖" }, ...]`

### `GET /produtos?categoria=racoes&q=coleira&pagina=1&limite=12&ordem=nome|recentes`
```json
{ "dados": { "itens": [ {
    "id": 1, "nome": "Ração Premium Cães Adultos 15kg", "slug": "racao-premium-caes-adultos-15kg",
    "tipoVenda": "livre", "precoCentavos": 21990, "disponivelOnline": true, "estoqueDisponivel": 12,
    "vendaSomentePresencial": false, "marca": "Marca X",
    "categoria": { "slug": "racoes", "nome": "Rações" },
    "imagem": { "url": "/api/v1/imagens/abc123.webp", "alt": "Pacote azul de ração..." } } ],
  "total": 9, "pagina": 1, "paginas": 1 } }
```
Regras já aplicadas pelo servidor:
- Produtos de **controle especial nunca aparecem**.
- Produtos **com receita** vêm com `precoCentavos: null`, `vendaSomentePresencial: true` e `disponivelOnline: false`. No app, mostre o aviso "Venda somente presencial com receita" e **não** mostre botão de compra.
- `estoqueDisponivel` vem limitado a 20, que é o máximo por item.
- Sempre use `imagem.alt` como texto alternativo da imagem (`accessibilityLabel` no React Native).

### `GET /produtos/{slug}`
Igual ao item acima, mais: `descricao`, `especie`, `pesoVolume`, `registroMapa`, `sku` e `usoVeterinario`. Se `usoVeterinario` for `true`, mostre o aviso "Uso veterinário. Leia a bula…".

### `POST /carrinho/cotacao`
O carrinho fica **no aparelho** e guarda só `produtoId` e `quantidade`. Antes de mostrar valores, peça a cotação:
```json
{ "itens": [ { "produtoId": 1, "quantidade": 2 } ], "modalidade": "retirada" }
```
Resposta: `itens` (com preço atual), `recusados` (`[{ produtoId, motivo }]`: mostre ao usuário e tire do carrinho), `subtotalCentavos`, `freteCentavos` e `totalCentavos`.

### `POST /pedidos`
Envie o header `X-Cliente: app`. O app **não envia preço**: o servidor calcula tudo.
```json
{
  "nome": "Maria Silva", "email": "maria@exemplo.com", "telefone": "11912345678",
  "modalidade": "retirada", "cpf": "", "endereco": "",
  "aceiteTermos": true, "termosVersao": "1.0", "marketing": false,
  "itens": [ { "produtoId": 1, "quantidade": 2 } ]
}
```
- `cpf` é **obrigatório só na entrega** (nota fiscal). Na retirada é opcional. `endereco` só vale na entrega.
- `aceiteTermos` precisa ser `true`, com uma caixa que o usuário marca. `marketing` deve vir **desmarcado** por padrão.
- **Antes** de enviar, mostre uma tela de revisão com itens, valores, forma de recebimento e o direito de desistência em 7 dias (Decreto 7.962/2013).
- Resposta 201: `{ codigo, status, itens, subtotalCentavos, freteCentavos, totalCentavos, email }`. Mostre o código na tela.
- 409: estoque mudou ou os Termos foram atualizados. Peça a cotação de novo.
- **Não guarde** nome, e-mail, telefone ou CPF no aparelho depois de enviar o pedido.

### `POST /contato`
`{ "nome", "email", "assunto", "mensagem" }`

### `POST /solicitacoes`
Direitos LGPD, desistência e trocas: `{ "tipo", "nome", "email", "codigoPedido", "detalhes" }`.
Tipos: `lgpd_acesso`, `lgpd_correcao`, `lgpd_eliminacao`, `lgpd_portabilidade`, `lgpd_revogacao`, `lgpd_outro`, `arrependimento`, `troca`. `codigoPedido` é obrigatório para `arrependimento` e `troca`. Resposta: `{ protocolo, prazo }`.

### `GET /imagens/{arquivo}`
Imagem do produto (webp), com cache longo.

---

## 2. Autenticação do admin no app (access token + refresh token)

Os clientes da loja **não têm conta**: compram como visitantes, o que significa menos dados guardados. A autenticação existe só para funcionários, por exemplo num app interno para gerenciar estoque e pedidos.

| Rota | Corpo | Resposta |
|---|---|---|
| `POST /auth/token` | `{ "email", "senha" }` | `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn: 900, admin }` |
| `POST /auth/refresh` | `{ "refreshToken" }` | um **par novo**. O refresh antigo deixa de valer |
| `POST /auth/logout` | (header Bearer) | revoga o access e o refresh no servidor |
| `GET /auth/eu` | (header Bearer) | `{ nome, email }` |
| `POST /auth/senha` | `{ atual, nova, confirma }` | troca a senha e encerra as **outras** sessões |
| `POST /auth/encerrar-outras` | (header Bearer) | encerra as outras sessões (site e app) |

**Como usar no app:**
1. Faça login com `/auth/token` e guarde os dois tokens no **armazenamento seguro** (`expo-secure-store`, que usa o Keychain no iPhone e o Keystore no Android). **Nunca** use AsyncStorage ou arquivos.
2. Mande `Authorization: Bearer <accessToken>` em todas as rotas `/admin/*`.
3. Se uma resposta vier **401**, chame `/auth/refresh` **uma vez**, troque os dois tokens guardados e repita a requisição. Se o refresh também falhar, volte para a tela de login.
4. Não faça duas renovações ao mesmo tempo: o refresh só vale uma vez. Se for reutilizado, o servidor entende que foi roubado e derruba a sessão inteira (detecção de reuso).

**Por que os tokens são "opacos" e não JWT?** O JWT é assinado mas **não criptografado**: qualquer pessoa lê o que está dentro, e ele não pode ser cancelado antes de expirar. Aqui o token é só um número aleatório de 256 bits. O banco guarda apenas o SHA-256 dele, então dá para revogar na hora (logout, troca de senha, roubo detectado) e nenhum dado vai dentro do token.

**Prazos:** access token de 15 minutos; refresh de 30 dias, trocado a cada uso.

---

## 3. Rotas de admin (Bearer no app, cookie no site)

| Método e rota | Uso |
|---|---|
| `GET /admin/resumo` | números do painel e dados legais pendentes |
| `GET /admin/categorias` | categorias com `id` |
| `GET /admin/produtos?q=` | lista completa (inclui ocultos e controlados) |
| `POST /admin/produtos` | cria produto |
| `GET` / `PUT /admin/produtos/{id}` | lê / edita |
| `POST /admin/produtos/{id}/imagem` | multipart: `imagem`, `alt`, `fonte`, `licencaOk=1` |
| `GET` / `POST /admin/estoque` | histórico / importa planilha do SimplesVet (multipart `planilha`) |
| `GET /admin/pedidos?status=` | lista |
| `GET` / `PATCH /admin/pedidos/{id}` | detalhe (CPF mascarado) / `{ "status": "pago" }` |
| `GET /admin/solicitacoes`, `GET` / `PATCH /admin/solicitacoes/{id}` | atendimento LGPD/CDC |
| `POST /admin/titulares/anonimizar` | `{ "email" }`: atende pedido de eliminação |
| `GET /admin/contatos`, `PATCH /admin/contatos/{id}` | mensagens |

Corpo de produto (`POST`/`PUT`):
```json
{ "nome": "...", "sku": "123", "categoriaId": 1, "especie": "cachorro", "marca": "...", "descricao": "...",
  "preco": "89,90", "estoque": 10, "tipoVenda": "livre", "registroMapa": "", "pesoVolume": "3 kg", "imagemAlt": "", "ativo": true }
```
Medicamentos (categoria `medicacoes`) exigem `registroMapa`. `tipoVenda`: `livre` | `receita` | `controlado`.

---

## 4. Checklist do app antes de publicar nas lojas

- [ ] Política de Privacidade linkada na loja de apps e dentro do app (vem de `GET /loja`).
- [ ] Rótulos de privacidade da Apple e a seção "Segurança dos dados" do Google Play preenchidos de acordo com a política.
- [ ] Nenhum SDK de rastreamento, como analytics ou publicidade, sem consentimento. Se usar, peça o consentimento no app e atualize a política.
- [ ] Tokens no armazenamento seguro; nada de dado pessoal salvo em cache.
- [ ] Acessibilidade: `accessibilityLabel` nas imagens e botões de ícone, tamanho de toque de no mínimo 44 pt e suporte a fonte grande.
- [ ] Mesmas telas de revisão do pedido e do aviso de receita que o site tem.
