/**
 * ------------------------------------------------------------------
 *  Schema do banco (SQLite) — DDL + tipos das linhas
 * ------------------------------------------------------------------
 *  O banco fica em data/atelier.sqlite e é criado/atualizado por
 *  `npm run db:build` (scripts/db-build.ts → src/db/build.ts).
 *
 *  Não há ORM nem módulo nativo: usamos o SQLite embutido do Node
 *  (node:sqlite, disponível a partir do Node 22.5), então
 *  `npm install` não precisa de compilador C++ em nenhum sistema.
 * ------------------------------------------------------------------
 */

export const DDL = `
CREATE TABLE IF NOT EXISTS site_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  subtitle         TEXT NOT NULL,
  author           TEXT NOT NULL,
  publisher        TEXT NOT NULL DEFAULT '',
  edition          TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL,
  dedication       TEXT NOT NULL DEFAULT '',
  spine_label      TEXT NOT NULL DEFAULT '',
  cover_image      TEXT NOT NULL,
  cover_art_title  TEXT NOT NULL DEFAULT '',
  cover_layout     TEXT,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- páginas do miolo, na ordem de leitura; as colunas de enquadramento
-- (fit, frame, backdrop, mount_tone, zoom, offset_x/y, rotation, radius,
--  plate_pad, shadow) são o que o /estudio edita, e layout_auto indica se
-- a página segue o cálculo automático ou foi ajustada à mão.
CREATE TABLE IF NOT EXISTS pages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id      INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  ord          INTEGER NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  kind         TEXT NOT NULL DEFAULT 'art',
  title        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  poem         TEXT,
  image_path   TEXT,
  image_width  INTEGER,
  image_height INTEGER,
  folio        INTEGER,
  fit          TEXT NOT NULL DEFAULT 'contain',
  frame        TEXT NOT NULL DEFAULT 'plate',
  backdrop     TEXT NOT NULL DEFAULT 'none',
  mount_tone   TEXT NOT NULL DEFAULT 'paper',
  zoom         REAL NOT NULL DEFAULT 1,
  offset_x     REAL NOT NULL DEFAULT 0,
  offset_y     REAL NOT NULL DEFAULT 0,
  rotation     REAL NOT NULL DEFAULT 0,
  radius       REAL NOT NULL DEFAULT 8,
  plate_pad    REAL NOT NULL DEFAULT 26,
  shadow       INTEGER NOT NULL DEFAULT 1,
  layout_auto  INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS artworks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  ord          INTEGER NOT NULL DEFAULT 0,
  title        TEXT NOT NULL,
  medium       TEXT NOT NULL,
  year         TEXT NOT NULL,
  image_path   TEXT NOT NULL,
  image_width  INTEGER,
  image_height INTEGER,
  span         INTEGER NOT NULL DEFAULT 6,
  shift        INTEGER NOT NULL DEFAULT 0,
  aspect       TEXT NOT NULL DEFAULT '4/5',
  description  TEXT NOT NULL DEFAULT '',
  tags         TEXT,
  featured     INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS faqs (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ord      INTEGER NOT NULL DEFAULT 0,
  question TEXT NOT NULL UNIQUE,
  answer   TEXT NOT NULL,
  items    TEXT,
  footnote TEXT
);

CREATE TABLE IF NOT EXISTS commissions (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT NOT NULL UNIQUE,
  ord   INTEGER NOT NULL DEFAULT 0,
  name  TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_book ON pages(book_id, ord);
CREATE INDEX IF NOT EXISTS idx_artworks_ord ON artworks(ord);

/* ------------------------------------------------------------------
 *  Área administrativa
 *  Estas tabelas NÃO entram em TABLES: o "db:seed --force" recria o
 *  conteúdo editorial, mas nunca apaga a conta do admin,
 *  as sessões, as configurações nem a caixa de pedidos recebidos.
 * ------------------------------------------------------------------ */

-- a senha nunca é guardada: guardamos Argon2id(senha, salt) com 64 bytes
-- (params traz t/m/p/dkLen em JSON, para poder endurecer sem migração)
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  params        TEXT NOT NULL,
  last_login_at INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  expires_at INTEGER NOT NULL,
  user_agent TEXT
);

-- secret = 1 → value está cifrado com AES-256-GCM (webhook, senha de SMTP…)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  secret     INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- caixa de entrada das comissões (o que o formulário do site envia)
CREATE TABLE IF NOT EXISTS requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  styles     TEXT,
  total      REAL NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'novo',
  discord_ok INTEGER NOT NULL DEFAULT 0,
  email_ok   INTEGER NOT NULL DEFAULT 0,
  error      TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON sessions(admin_id);
`;

/** Tabelas de conteúdo, na ordem em que podem ser apagadas (db:seed --force). */
export const TABLES = ["site_meta", "books", "pages", "artworks", "faqs", "commissions"] as const;

/** Estados possíveis de um pedido de comissão. */
export const REQUEST_STATUSES = ["novo", "lido", "respondido", "arquivado"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/* --------------------------- tipos das linhas --------------------- */

export type Bool01 = 0 | 1;

export interface SiteMetaRow {
  key: string;
  value: string;
  updated_at: number;
}

export interface BookRow {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  edition: string;
  description: string;
  dedication: string;
  spine_label: string;
  cover_image: string;
  cover_art_title: string;
  cover_layout: string | null;
  created_at: number;
  updated_at: number;
}

export interface PageRow {
  id: number;
  book_id: number;
  ord: number;
  slug: string;
  kind: string;
  title: string;
  type: string;
  description: string;
  poem: string | null;
  image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  folio: number | null;
  fit: string;
  frame: string;
  backdrop: string;
  mount_tone: string;
  zoom: number;
  offset_x: number;
  offset_y: number;
  rotation: number;
  radius: number;
  plate_pad: number;
  shadow: Bool01;
  layout_auto: Bool01;
  created_at: number;
  updated_at: number;
}

export interface ArtworkRow {
  id: number;
  slug: string;
  ord: number;
  title: string;
  medium: string;
  year: string;
  image_path: string;
  image_width: number | null;
  image_height: number | null;
  span: number;
  shift: number;
  aspect: string;
  description: string;
  tags: string | null;
  featured: Bool01;
  created_at: number;
}

export interface FaqRow {
  id: number;
  ord: number;
  question: string;
  answer: string;
  items: string | null;
  footnote: string | null;
}

export interface CommissionRow {
  id: number;
  slug: string;
  ord: number;
  name: string;
  price: number;
}

export interface AdminRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  salt: string;
  params: string;
  last_login_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface SessionRow {
  token: string;
  admin_id: number;
  created_at: number;
  expires_at: number;
  user_agent: string | null;
}

export interface SettingRow {
  key: string;
  value: string;
  secret: Bool01;
  updated_at: number;
}

export interface RequestRow {
  id: number;
  name: string;
  email: string;
  message: string;
  styles: string | null;
  total: number;
  status: string;
  discord_ok: Bool01;
  email_ok: Bool01;
  error: string | null;
  user_agent: string | null;
  created_at: number;
}
