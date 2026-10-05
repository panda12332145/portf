/* ==================================================================
 *  Especificação da área administrativa (servidor)
 *  - chaves de configuração e seus valores padrão;
 *  - mapa das tabelas de conteúdo editáveis pelo painel, com o tipo
 *    de cada campo (usado para validar e converter o que chega).
 * ================================================================== */

export type FieldType =
  | "text"
  | "textarea"
  | "int"
  | "real"
  | "bool"
  | "json"
  | "nullable-text"
  | "nullable-int";

export interface FieldDef {
  col: string;
  type: FieldType;
  required?: boolean;
  maxLen?: number;
  min?: number;
  max?: number;
  oneOf?: readonly string[];
}

export interface ResourceDef {
  /** nome usado na URL: /api/admin/resources/<id> */
  id: "artworks" | "faqs" | "styles" | "pages" | "requests";
  table: string;
  label: string;
  order: string;
  /** coluna que guarda o slug (gera sozinho quando vazio) */
  slugFrom?: "title" | "name";
  fields: Record<string, FieldDef>;
}

/* --------------------------- configurações ------------------------ */

/** Chaves gravadas cifradas com AES-256-GCM. */
export const SECRET_SETTING_KEYS: string[] = ["discord_webhook", "smtp_pass"];

export const DEFAULT_SETTINGS: Record<string, string> = {
  commissions_open: "1",
  commissions_closed_title: "Comissões fechadas — por enquanto",
  commissions_closed_note:
    "A fila do ateliê está cheia neste momento. Escreva para o estúdio contando a sua ideia: se abrir uma vaga, avisamos você primeiro.",
  commission_email: "contato@ateliergirassol.art",
  discord_enabled: "0",
  discord_webhook: "",
  discord_username: "Atelier Girassol",
  smtp_enabled: "0",
  smtp_host: "",
  smtp_port: "587",
  smtp_secure: "0",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
};

/** Todas as chaves que podem ser gravadas na tabela settings. */
export const KNOWN_SETTING_KEYS = new Set([
  "commissions_open",
  "commissions_closed_note",
  "commissions_closed_title",
  "commission_email",
  "discord_enabled",
  "discord_webhook",
  "discord_username",
  "smtp_enabled",
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
]);

/** Rótulos da tela de configurações (usados também pela API). */
export const SETTING_LABELS: Record<string, string> = {
  commissions_open: "Comissões abertas",
  commission_email: "E-mail que recebe as comissões",
  discord_enabled: "Avisar no Discord",
  discord_webhook: "Webhook do Discord",
  discord_username: "Nome exibido no Discord",
  smtp_enabled: "Enviar por e-mail (SMTP)",
  smtp_host: "Servidor SMTP",
  smtp_port: "Porta",
  smtp_secure: "TLS direto (porta 465)",
  smtp_user: "Usuário SMTP",
  smtp_pass: "Senha SMTP",
  smtp_from: "Remetente",
};

/* ---------------------------- recursos ---------------------------- */

export const RESOURCES: Record<string, ResourceDef> = {
  artworks: {
    id: "artworks",
    table: "artworks",
    label: "Obras do site",
    order: "ord",
    slugFrom: "title",
    fields: {
      ord: { col: "ord", type: "int" },
      slug: { col: "slug", type: "text", maxLen: 80 },
      title: { col: "title", type: "text", required: true, maxLen: 160 },
      medium: { col: "medium", type: "text", maxLen: 120 },
      year: { col: "year", type: "text", maxLen: 12 },
      imagePath: { col: "image_path", type: "text", maxLen: 300 },
      imageWidth: { col: "image_width", type: "nullable-int" },
      imageHeight: { col: "image_height", type: "nullable-int" },
      span: { col: "span", type: "int", min: 3, max: 12 },
      shift: { col: "shift", type: "int", min: -60, max: 60 },
      aspect: { col: "aspect", type: "text", maxLen: 16 },
      description: { col: "description", type: "textarea", maxLen: 1200 },
      tags: { col: "tags", type: "json" },
      featured: { col: "featured", type: "bool" },
    },
  },

  faqs: {
    id: "faqs",
    table: "faqs",
    label: "Perguntas frequentes",
    order: "ord",
    fields: {
      ord: { col: "ord", type: "int" },
      question: { col: "question", type: "text", required: true, maxLen: 300 },
      answer: { col: "answer", type: "textarea", required: true, maxLen: 4000 },
      items: { col: "items", type: "json" },
      footnote: { col: "footnote", type: "nullable-text", maxLen: 800 },
    },
  },

  styles: {
    id: "styles",
    table: "commissions",
    label: "Estilos de arte (comissões)",
    order: "ord",
    slugFrom: "name",
    fields: {
      ord: { col: "ord", type: "int" },
      slug: { col: "slug", type: "text", maxLen: 80 },
      name: { col: "name", type: "text", required: true, maxLen: 160 },
      price: { col: "price", type: "real", required: true, min: 0, max: 1_000_000 },
    },
  },

  /* caixa de entrada: só o estado muda; o resto é histórico */
  requests: {
    id: "requests",
    table: "requests",
    label: "Pedidos recebidos",
    order: "created_at DESC",
    fields: {
      status: {
        col: "status",
        type: "text",
        oneOf: ["novo", "lido", "respondido", "arquivado"],
      },
    },
  },

  pages: {
    id: "pages",
    table: "pages",
    label: "Páginas do livro",
    order: "ord",
    fields: {
      ord: { col: "ord", type: "int", min: 1 },
      slug: { col: "slug", type: "text", maxLen: 80 },
      kind: { col: "kind", type: "text", oneOf: ["title", "art", "interlude", "finale"] },
      title: { col: "title", type: "text", required: true, maxLen: 160 },
      type: { col: "type", type: "text", maxLen: 120 },
      description: { col: "description", type: "textarea", maxLen: 2000 },
      poem: { col: "poem", type: "json" },
      imagePath: { col: "image_path", type: "nullable-text", maxLen: 300 },
      imageWidth: { col: "image_width", type: "nullable-int" },
      imageHeight: { col: "image_height", type: "nullable-int" },
      folio: { col: "folio", type: "nullable-int", min: 0, max: 999 },
      fit: { col: "fit", type: "text", oneOf: ["contain", "cover"] },
      frame: { col: "frame", type: "text", oneOf: ["plate", "bleed", "none"] },
      backdrop: { col: "backdrop", type: "text", oneOf: ["blur", "tint", "paper", "none"] },
      mountTone: { col: "mount_tone", type: "text", oneOf: ["paper", "ink"] },
      zoom: { col: "zoom", type: "real", min: 0.4, max: 2.5 },
      offsetX: { col: "offset_x", type: "real", min: -45, max: 45 },
      offsetY: { col: "offset_y", type: "real", min: -45, max: 45 },
      rotation: { col: "rotation", type: "real", min: -18, max: 18 },
      radius: { col: "radius", type: "real", min: 0, max: 90 },
      platePad: { col: "plate_pad", type: "real", min: 0, max: 120 },
      shadow: { col: "shadow", type: "bool" },
      layoutAuto: { col: "layout_auto", type: "bool" },
    },
  },
};

/* ---------------------------- conversão --------------------------- */

export interface NormalizeResult {
  values: Record<string, unknown>;
  errors: string[];
}

/**
 * Converte o corpo JSON do painel para os tipos da tabela.
 * Ignora chaves desconhecidas (o SQL usa só o que existe).
 */
export function normalizeValues(
  def: ResourceDef,
  body: Record<string, unknown>,
  { creating = false }: { creating?: boolean } = {},
): NormalizeResult {
  const values: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const [key, field] of Object.entries(def.fields)) {
    if (!(key in body)) {
      if (creating && field.required) errors.push(`Campo obrigatório: ${key}`);
      continue;
    }
    const raw = body[key];
    switch (field.type) {
      case "text":
      case "textarea": {
        const value = raw === null || raw === undefined ? "" : String(raw).trim();
        if (field.required && !value) errors.push(`Campo obrigatório: ${key}`);
        if (field.maxLen && value.length > field.maxLen)
          errors.push(`${key}: máximo de ${field.maxLen} caracteres`);
        if (field.oneOf && value && !field.oneOf.includes(value))
          errors.push(`${key}: valor inválido (${field.oneOf.join(", ")})`);
        values[field.col] = value;
        break;
      }
      case "nullable-text": {
        const value = raw === null || raw === undefined ? "" : String(raw).trim();
        values[field.col] = value === "" ? null : value;
        break;
      }
      case "int":
      case "real": {
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          errors.push(`${key}: precisa ser um número`);
          break;
        }
        const rounded = field.type === "int" ? Math.round(num) : num;
        if (field.min !== undefined && rounded < field.min)
          errors.push(`${key}: mínimo ${field.min}`);
        else if (field.max !== undefined && rounded > field.max)
          errors.push(`${key}: máximo ${field.max}`);
        values[field.col] = rounded;
        break;
      }
      case "nullable-int": {
        if (raw === null || raw === undefined || raw === "") {
          values[field.col] = null;
          break;
        }
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          errors.push(`${key}: precisa ser um número`);
          break;
        }
        values[field.col] = Math.round(num);
        break;
      }
      case "bool": {
        values[field.col] = raw === true || raw === 1 || raw === "1" || raw === "true" ? 1 : 0;
        break;
      }
      case "json": {
        if (raw === null || raw === undefined) {
          values[field.col] = null;
          break;
        }
        if (Array.isArray(raw)) {
          const list = raw.map((v) => String(v)).filter((v) => v.trim() !== "");
          values[field.col] = list.length ? JSON.stringify(list) : null;
          break;
        }
        if (typeof raw === "string") {
          values[field.col] = raw.trim() === "" ? null : raw.trim();
          break;
        }
        values[field.col] = JSON.stringify(raw);
        break;
      }
    }
  }

  return { values, errors };
}

/** "Sol em Aquarela" → "sol-em-aquarela" */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}
