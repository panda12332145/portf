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

1. confere se o Node instalado é 22+ (o banco SQLite usa `better-sqlite3`);
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

---

## 1. Rodando

Requer **Node 22+** (o `better-sqlite3` é nativo).

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
| `npm run build` / `npm run start:lan` | build e produção (escuta em `0.0.0.0`) |
| `npm run typecheck` | TypeScript |

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

## 3. Banco: SQLite + Drizzle

- Arquivo: `data/atelier.sqlite` (override por `ATELIER_DB_PATH`).
- Acesso: `better-sqlite3` + `drizzle-orm` (schema em `src/db/schema.ts`, consultas em `src/db/queries.ts`).
- `src/db/build.ts` contém o DDL, o seed e o `ensureDatabase()`.

### Tabelas

| tabela | conteúdo |
| --- | --- |
| `site_meta` | textos gerais do site (chave → valor): hero, títulos de seção, e-mail, imagem de fundo, stats |
| `books` | o livro: título, subtítulo, autoria, editora, edição, descrição, dedicatória, **arte de capa** e `cover_layout` |
| `pages` | o miolo, na ordem de leitura, com texto, poema, `image_path`, dimensões reais e **o enquadramento** |
| `artworks` | obras do portfólio: título, técnica, ano, imagem, posição no grid, proporção, tags |
| `faqs` | perguntas frequentes (com lista opcional e nota) |
| `commissions` | tabela de preços das comissões |

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
| `/estudio` | editor visual de enquadramento (grava no SQLite) |
| `GET /api/book` | livro + páginas com layout |
| `GET /api/book/pages/[slug]` | uma página |
| `PATCH /api/book/pages/[slug]` | atualiza o enquadramento (`{zoom, rotation, offsetX…}` ou `{reset:true}`) |
| `GET /api/artworks` · `/api/faqs` · `/api/commissions` | conteúdo do portfólio |
| `GET /api/health` | checagem (caminho do banco, nº de páginas) |

---

## 6. Deploy

```bash
npm ci
npm run build     # roda db:build antes do build
npm start
```

- Node **22+**.
- Leve `data/atelier.sqlite` junto (já versionado) ou deixe o `ensureDatabase()` criar no primeiro boot.
- Para banco somente leitura em produção, aponte `ATELIER_DB_PATH` para uma cópia e use o /estudio só em desenvolvimento.

---

## 7. O que veio de onde

| origem | virou |
| --- | --- |
| `sunflower-parallax-art-portfolio` | home completa (hero, fundo em parallax, borboletas, portfólio, FAQ, comissões) — agora alimentada pelo SQLite |
| `enhance-book-website-features` | livro 3D (folhas com física, capa, cenas, lightbox, galeria) — **reposicionado de pé**, com enquadramento por banco e novo desenho de página |
