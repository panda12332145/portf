# Atelier Girassol — portfólio de arte + livro ilustrado 3D

Um **único projeto Next.js** que junta, num só site:

- o **portfólio de arte** do estúdio (home, acervo, FAQ, comissões);
- o **livro ilustrado interativo** “O Jardim das Horas”, agora **de pé, em 3D**, no lugar da antiga seção “01 — Portfólio”;
- um **banco SQLite** (`data/atelier.sqlite`) que guarda *todo* o conteúdo — textos, obras, livro, páginas e o **enquadramento de cada imagem**;
- um **editor visual** (`/estudio`) para ajustar zoom, recorte, moldura e diagonal de cada página e gravar direto no banco.

> Os dois projetos anteriores (`enhance-book-website-features` e `sunflower-parallax-art-portfolio`) foram consolidados aqui e removidos; todo o conteúdo deles foi migrado.

---

## 0. Ligar o site com um clique (testes locais)

### Windows — `iniciar.bat`

Duplo clique em **`iniciar.bat`** (ou rode `iniciar.bat` no terminal). Ele faz tudo:

1. confere se o Node instalado é **22.5+** e se ele já expõe o SQLite embutido (`node:sqlite`);
2. instala as dependências na primeira vez;
3. sincroniza o banco `data/atelier.sqlite`;
4. sobe o servidor em `http://localhost:3000`;
5. **abre o navegador sozinho** assim que o site responde;
6. mostra o endereço da sua rede (ex.: `http://192.168.0.10:3000`) para testar no celular.

Deixe a janela aberta — `Ctrl+C` encerra o servidor.

| comando | o que faz |
| --- | --- |
| `iniciar.bat` | modo desenvolvimento na porta 3000 |
| `iniciar.bat 4000` | desenvolvimento na porta 4000 |
| `iniciar.bat prod` | build de produção + servidor (mais leve para testar) |
| `iniciar.bat 4000 prod` | idem, na porta 4000 |
| `iniciar.bat noopen` | não abre o navegador automaticamente |

### Linux / macOS / WSL — `iniciar.sh`

```bash
chmod +x iniciar.sh
./iniciar.sh            # dev na 3000
./iniciar.sh 4000 prod  # produção na 4000
```

Os dois scripts ficam na raiz do projeto e não alteram nada além de `data/atelier.sqlite`.
Eles também cuidam do `node:sqlite`: se o Node for 22.5–23.3 (que exige a flag
`--experimental-sqlite`), a flag é adicionada automaticamente.

---

## 1. Rodando

Requer **Node 22.5 ou superior** (recomendado 22 LTS ou 24).

> **Não é preciso compilador C++ / Visual Studio.** O banco usa o SQLite
> embutido do Node (`node:sqlite`), então `npm install` baixa apenas
> JavaScript puro — funciona igual no Windows, macOS e Linux.

```bash
npm install
npm run dev          # cria/atualiza o SQLite e sobe em http://localhost:3000
```

Outros comandos:

| comando | o que faz |
| --- | --- |
| `npm run db:build` | cria o `data/atelier.sqlite`, o schema e sincroniza o conteúdo de `src/content/seed.ts` (preserva ajustes manuais do /estudio) |
| `npm run db:seed` | recria o banco do zero (`--force`) |
| `npm run db:import` | varre `public/book/` e cadastra no banco toda imagem ainda não catalogada, já com enquadramento automático |
| `npm run db:import -- --list` | só lista o que seria importado |
| `npm run db:inspect` | resumo do banco (livro, páginas, contagens) |
| `npm run db:inspect -- --sql "SELECT * FROM pages"` | SQL livre |
| `npm run dev:lan` | como o `dev`, mas escutando na rede (`0.0.0.0`) para testar no celular |
| `npm run admin:pass` | **conta da administradora**: gera uma senha nova para a primeira conta e mostra no terminal |
| `npm run admin:pass -- --list` | lista as contas administrativas |
| `npm run admin:pass -- email@x.com senha` | cria/atualiza a conta com esse e-mail e senha |
| `npm run build` / `npm run start:lan` | build e produção (escuta em `0.0.0.0`) |
| `npm run typecheck` | TypeScript |

> Na **primeira execução** o banco cria a conta administrativa e imprime a senha
> inicial no terminal (algo como `senha inicial: k7Qm2x_Pd91`). Anote — ela não
> fica guardada em lugar nenhum em texto puro. Perdeu? `npm run admin:pass`.

O arquivo `data/atelier.sqlite` **é versionado de propósito**: clonando o repositório o site já funciona. Se ele não existir (ou estiver vazio), o servidor o recria sozinho na primeira requisição (`ensureDatabase()`), usando `src/content/seed.ts` + `public/book/`.

---

## 2. Onde ficam as imagens (pastas separadas)

```
public/
├── book/      ← SÓ imagens do livro (3D). Exclusiva.
│   ├── capa.jpg              arte da capa
│   ├── art-editorial.jpg     páginas do miolo…
│   ├── artist.jpg
│   ├── art-chibi.jpg
│   ├── art-watercolor.jpg
│   ├── art-character.jpg
│   ├── art-portrait.jpg
│   └── field.jpg
├── images/    ← imagens gerais do site (hero, fundo, obras da galeria)
└── fonts/     ← Fraunces, Manrope e Cormorant Garamond self-hosted (funciona offline)
```

O livro **só lê** arquivos de `public/book/`. As obras do portfólio vivem em `public/images/`. Nada se mistura — e é isso que o banco registra (`pages.image_path` começa sempre com `/book/`).

### Adicionar novas artes ao livro

1. jogue o arquivo em `public/book/` (jpg/png/webp);
2. `npm run db:import` → a imagem entra no SQLite como página nova, com o enquadramento calculado;
3. abra `/estudio`, escolha a página, ajuste o que quiser e clique em **Salvar no banco**.

---

## 3. Banco: SQLite (embutido no Node)

- Arquivo: `data/atelier.sqlite` (override por `ATELIER_DB_PATH`).
- Acesso: **`node:sqlite`** — o SQLite que já vem dentro do Node desde a 22.5.
  Sem módulos nativos, sem ORM: SQL direto em `src/db/queries.ts`, com um helper
  fino (`src/db/sqlite.ts`) que cuida de statements preparados, transações e
  parâmetros nomeados.
- `src/db/schema.ts` traz o **DDL** (as tabelas, comentadas) e os tipos das linhas;
  `src/db/build.ts` cria o arquivo, semeia o conteúdo e mantém o `ensureDatabase()`.
- Para inspecionar: `npm run db:inspect` (ou `npm run db:inspect -- --sql "…"`).

> Por que não `better-sqlite3`/Drizzle? `better-sqlite3` é um módulo nativo: em
> versões de Node sem binário pré-compilado ele tenta compilar e exige Visual
> Studio no Windows. Com `node:sqlite` a instalação é 100% JavaScript.

### Tabelas

| tabela | conteúdo |
| --- | --- |
| `site_meta` | textos gerais do site (chave → valor): hero, títulos de seção, e-mail, imagem de fundo, stats |
| `books` | o livro: título, subtítulo, autoria, editora, edição, descrição, dedicatória, **arte de capa** e `cover_layout` |
| `pages` | o miolo, na ordem de leitura, com texto, poema, `image_path`, dimensões reais e **o enquadramento** |
| `artworks` | obras do portfólio: título, técnica, ano, imagem, posição no grid, proporção, tags |
| `faqs` | perguntas frequentes (com lista opcional e nota) |
| `commissions` | tabela de preços das comissões |
| `admins` | a conta administrativa: e-mail + `Argon2id(senha, salt)` de 64 bytes |
| `sessions` | sessões abertas (token, validade, agente) — revogáveis |
| `settings` | configurações: comissões abertas/fechadas, e-mail de destino, webhook, SMTP |
| `requests` | caixa de entrada: cada pedido enviado pelo formulário do site |

> `npm run db:seed` recria o conteúdo editorial (site_meta, livro, obras, FAQ,
> preços) **mas não apaga** conta, sessões, configurações nem pedidos recebidos.

### Enquadramento (o coração do “dinâmico”)

Cada página tem colunas próprias — calculadas automaticamente no `db:build` e ajustáveis **pelo /estudio ou por SQL**:

| coluna | valores | efeito |
| --- | --- | --- |
| `fit` | `contain` \| `cover` | imagem inteira ou preenchendo (recorta) |
| `frame` | `plate` \| `bleed` \| `none` | moldura de museu, sangrando até a margem ou sem moldura |
| `backdrop` | `blur` \| `tint` \| `paper` \| `none` | fundo desfocado da própria arte, tonal, papel ou nada |
| `mount_tone` | `paper` \| `ink` | tom do passe-partout |
| `zoom` | `0.4` – `2.5` | aproximação |
| `offset_x`, `offset_y` | `-45` – `45` (`%` da área) | deslocamento fino |
| `rotation` | `-18` – `18` (graus) | **deixa a arte na diagonal** dentro da página |
| `radius`, `plate_pad`, `shadow` | px / bool | cantos, respiro da moldura, sombra |

Regras do automático (`src/lib/layout.ts` → `autoLayout`): **retrato** ganha moldura estreita e cantos maiores; **paisagem** ganha respiro maior; **panorâmica** vira prato largo; e imagens que preenchem pouco a área recebem **fundo desfocado da própria arte**, para nunca sobrar buraco branco. Ajuste manual grava `layout_auto = 0` e o item deixa de ser recalculado.

Exemplo de ajuste direto no banco (sem abrir o site):

```sql
-- deixa “Jardineira” levemente na diagonal, com fundo tonal
UPDATE pages
   SET rotation = -4.5, zoom = 1.12, offset_y = 3,
       backdrop = 'tint', radius = 40, plate_pad = 46,
       layout_auto = 0
 WHERE slug = 'jardineira';
```

---

## 3.1 Área administrativa (`/admin`)

A área administrativa tem **só a tela de login** até você entrar — nada do painel
é renderizado antes disso. Depois do login abre o painel, onde praticamente tudo
do site é editável:

| aba | o que dá para fazer |
| --- | --- |
| **Painel** | visão geral (nº de obras, páginas, FAQs, estilos), abrir/fechar comissões num clique, caminho do banco |
| **Textos e imagens** | todos os textos do site (hero, seções, botões, rodapé, título da aba), imagens (topo, fundo), ícone da marca e o **catálogo de estilos de arte**… além de qualquer outra chave de `site_meta` |
| **Comissões** | abertas/fechadas + descrição da fila fechada, **preços** de cada estilo, **e-mail que recebe as comissões**, **webhook do Discord** (com botão de teste) e SMTP opcional |
| **FAQ** | criar, editar, reordenar e excluir perguntas, com lista e nota de cada uma |
| **Obras do site** | adicionar, subir/descer, editar e **excluir** obras; enviar imagem; proporção, colunas e deslocamento no grid |
| **Livro** | ficha, capa e **todas as páginas do miolo**: adicionar, mover, editar, excluir, trocar a arte e ajustar o enquadramento (ou recalcular automático) |
| **Mensagens** | cada pedido enviado pelo formulário, com estilos, estimativa, estados (novo/lido/respondido/arquivado), reenvio ao Discord e resposta por e-mail |
| **Conta** | nome, e-mail de entrada e troca de senha (com a senha atual) |

O botão **Estúdio** (`/estudio`) continua sendo o editor visual do enquadramento,
com pré-visualização da página; ele também pede login agora.

### Como a segurança está montada

- **Senha:** Argon2id (JavaScript puro, via `@noble/hashes`) com **salt aleatório
  de 16 bytes por conta** e **hash de 64 bytes**. Parâmetros guardados junto da
  conta (`{"t":2,"m":19456,"p":1,"dkLen":64}`), então dá para endurecer sem migrar.
- **Sessão:** token aleatório de 64 caracteres guardado na tabela `sessions` e
  entregue num cookie `HttpOnly` + `SameSite=Lax`; expira em 7 dias e é revogável
  (trocar a senha encerra as outras sessões).
- **Cofre:** o webhook do Discord e a senha de SMTP ficam **cifrados com
  AES-256-GCM** no banco. A chave vem de `ATELIER_SECRET` (recomendado) ou do
  arquivo `.atelier-secret`, criado sozinho na raiz do projeto e **fora do git**.
  O que está no banco tem a forma `v1.<iv>.<tag>.<cifra>`.
- **Login:** 8 tentativas por 10 minutos por IP; erro genérico (não revela se o
  e-mail existe) e uma espera artificial de 350 ms.

### Tema claro / escuro

No topo de todas as páginas (site e painel) existe um seletor de tema com três
opções: **Sistema** (padrão de fábrica — segue o `prefers-color-scheme` do seu
aparelho), **Claro** e **Escuro**. A escolha fica no `localStorage` do navegador
(chave `atelier-tema`), então ela se mantém nas próximas visitas; um script no
`<head>` aplica o tema antes da primeira pintura, sem piscar. O palco do livro 3D
e o lightbox continuam escuros nos dois temas.

---

## 4. O livro 3D

- `src/components/book/Book.tsx` — geometria das folhas (malha deformável = papel de verdade), molas de física, arrasto de página, capa com dobradiça.
  O grupo externo gira o livro **90° em X**: ele fica **em pé**, parado no chão, capa virada para quem olha; ao abrir, desliza para o centro sem tombar.
- `src/components/book/Scene.tsx` — luz de estúdio, poeira dourada, chão com poça de luz e câmera responsiva (limita o enquadramento por altura *e* largura, então funciona em celular).
- `src/lib/page-canvas.ts` — desenha **cada página em canvas 1024×1350** (papel, arte, título, verso, fólio, ornamentos) respeitando o layout vindo do SQLite. É a mesma função usada pelo livro e pelo /estudio: o que você vê no editor é exatamente a textura da folha.
- Texturas secundárias: tecido da capa, guarda marmorizada, corte das páginas e **lombada com o título dourado**.

Interações: clique para abrir, arraste a folha como papel, clique na borda para virar, clique **na ilustração** para ampliar (lightbox com zoom e pan), setas ← → do teclado, barra de progresso e botão “ampliar ilustração”.

---

## 5. Rotas

| rota | descrição |
| --- | --- |
| `/` | home: hero, **seção do livro 3D**, portfólio, FAQ, comissões |
| `/galeria` | acervo completo: obras do estúdio + as páginas do livro (`public/book/`) |
| `/estudio` | editor visual de enquadramento (grava no SQLite) — pede login |
| `/admin` | área administrativa: tela de login e, depois dela, o painel completo |
| `GET /api/book` | livro + páginas com layout |
| `GET /api/book/pages/[slug]` | uma página |
| `PATCH /api/book/pages/[slug]` | atualiza o enquadramento (`{zoom, rotation, offsetX…}` ou `{reset:true}`) |
| `GET /api/artworks` · `/api/faqs` · `/api/commissions` | conteúdo do portfólio |
| `POST /api/commissions` | recebe o formulário: grava o pedido na caixa de entrada e avisa por Discord/e-mail |
| `POST /api/admin/login` · `DELETE /api/admin/session` | entrar e sair |
| `GET/PATCH /api/admin/settings` | comissões abertas/fechadas, e-mail, webhook, SMTP |
| `GET/PATCH /api/admin/site-meta` | os textos do site (e criar/apagar chaves) |
| `GET/PATCH /api/admin/book` | ficha e capa do livro |
| `GET/POST/PUT /api/admin/resources/[resource]` | listar, criar e reordenar obras, FAQ, estilos e páginas |
| `PATCH/DELETE /api/admin/resources/[resource]/[id]` | editar e excluir um registro |
| `GET/POST /api/admin/upload` | acervo de imagens e envio de arquivos (`folder=site|book`) |
| `PATCH /api/admin/account` | nome, e-mail e senha da conta |
| `GET /api/health` | checagem (caminho do banco, nº de páginas) |

---

## 6. Deploy

```bash
npm ci
npm run build     # roda db:build antes do build
npm start
```

- Node **22.5+** (nada de compilador: só JavaScript).
- Leve `data/atelier.sqlite` junto (já versionado) ou deixe o `ensureDatabase()` criar no primeiro boot.
- Para banco somente leitura em produção, aponte `ATELIER_DB_PATH` para uma cópia e use o /estudio só em desenvolvimento.
- **Defina `ATELIER_SECRET`** no servidor (uma frase longa e única). Sem ela, a
  chave do cofre é gerada em `.atelier-secret` na pasta do projeto — que em
  hospedagem pode ser recriada a cada deploy, invalidando os segredos salvos.
- A área administrativa pede login, mas não há HTTPS embutido: em produção,
  publique atrás de um proxy com TLS.

---

## 6.1 Problemas comuns

| sintoma | causa / solução |
| --- | --- |
| `gyp ERR! find VS … Visual Studio` | você está numa versão antiga do projeto que usava `better-sqlite3`. Rode `npm install` novamente depois de atualizar (`git pull`): o projeto agora usa o SQLite do Node e não compila nada. |
| `Node vXX e antigo demais` no `iniciar.bat` | atualize o Node para 22 LTS (22.13+) ou 24 em https://nodejs.org |
| `ExperimentalWarning: SQLite is an experimental feature` | aviso inofensivo do Node; os scripts já o silenciam com `--disable-warning=ExperimentalWarning`. |
| `EPERM … rmdir node_modules` no Windows | editor aberto, antivírus ou OneDrive segurando a pasta. Feche-os e rode de novo (o `iniciar.bat` já tenta reinstalar limpando `node_modules`). |
| esqueci a senha do painel | `npm run admin:pass` (mostra uma senha nova) |
| quero trocar o e-mail da conta | painel → **Conta**, ou `npm run admin:pass -- email@x.com senha` |
| quero recomeçar o banco do zero | `npm run db:seed` (mantém conta, configurações e pedidos) |
| voltar ao tema escuro fixo | no seletor de tema do topo, escolha **Escuro** (ou limpe a chave `atelier-tema` do navegador para voltar a seguir o sistema) |

---

## 7. O que veio de onde

| origem | virou |
| --- | --- |
| `sunflower-parallax-art-portfolio` | home completa (hero, fundo em parallax, borboletas, portfólio, FAQ, comissões) — agora alimentada pelo SQLite |
| `enhance-book-website-features` | livro 3D (folhas com física, capa, cenas, lightbox, galeria) — **reposicionado de pé**, com enquadramento por banco e novo desenho de página |

## 📊 Métricas

<!-- metrics:start -->
| Métrica | Valor |
|---|---|
| ⭐ Stars | 0 |
| 🍴 Forks | 0 |
| 📌 Issues abertas | 0 |
| 🕐 Último commit | 2026-10-05 |
<!-- metrics:end -->
