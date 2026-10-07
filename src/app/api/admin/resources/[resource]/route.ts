import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import { RESOURCES, normalizeValues, slugify } from "@/lib/admin/spec";
import { autoLayout, clampLayout, type PageLayout } from "@/lib/layout";
import {
  insertRow,
  listRows,
  maxOrd,
  reorderRows,
  slugTaken,
  updateRowById,
} from "@/db/admin";
import { sqlite } from "@/db/queries";
import { dimensionsOf } from "@/lib/upload";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string }> };

/** Lista (GET), cria (POST) e reordena (PUT) as tabelas de conteúdo. */

async function resolve(ctx: Ctx) {
  const { resource } = await ctx.params;
  const def = RESOURCES[resource];
  return def ? { def } : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const found = await resolve(ctx);
  if (!found) return NextResponse.json({ error: "Recurso desconhecido." }, { status: 404 });

  return NextResponse.json({ rows: listRows(found.def.table, found.def.order) });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const found = await resolve(ctx);
  if (!found) return NextResponse.json({ error: "Recurso desconhecido." }, { status: 404 });
  const { def } = found;

  if (def.id === "requests") {
    return NextResponse.json(
      { error: "Os pedidos chegam pelo formulário do site — não se cria por aqui." },
      { status: 405 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { values, errors } = normalizeValues(def, body, { creating: true });
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  /* -------- slug: usa o informado ou gera a partir do título -------- */
  if (def.slugFrom) {
    const source = String(body[def.slugFrom] ?? "");
    let slug = slugify(String(values.slug ?? "") || source);
    if (!slug) slug = `item-${Date.now().toString(36)}`;
    let attempt = 1;
    const base = slug;
    while (slugTaken(def.table, slug)) slug = `${base}-${++attempt}`;
    values.slug = slug;
  }

  /* ---------------- ordem: entra no fim da lista -------------------- */
  if (!values.ord) values.ord = maxOrd(def.table) + 1;

  /* ------------------- páginas do livro: livro + arte -------------- */
  if (def.id === "pages") {
    const bookId = sqlite.get<{ id: number }>(`SELECT id FROM books ORDER BY id LIMIT 1`)?.id;
    if (!bookId) return NextResponse.json({ error: "Nenhum livro no banco." }, { status: 400 });
    values.book_id = bookId;

    const imagePath = (values.image_path as string | null) ?? null;
    const size = dimensionsOf(imagePath);
    if (size) {
      values.image_width = size.width;
      values.image_height = size.height;
    }
    // página nova nasce com o enquadramento automático
    const wantsAuto = values.layout_auto === undefined ? true : values.layout_auto === 1;
    if (wantsAuto) {
      const layout = clampLayout(autoLayout(size));
      Object.assign(values, {
        fit: layout.fit,
        frame: layout.frame,
        backdrop: layout.backdrop,
        mount_tone: layout.mountTone,
        zoom: layout.zoom,
        offset_x: layout.offsetX,
        offset_y: layout.offsetY,
        rotation: layout.rotation,
        radius: layout.radius,
        plate_pad: layout.platePad,
        shadow: layout.shadow ? 1 : 0,
        layout_auto: 1,
      });
    }
    values.created_at = Date.now();
    values.updated_at = Date.now();
  }

  if (def.id === "artworks") {
    const size = dimensionsOf((values.image_path as string | null) ?? null);
    if (size) {
      values.image_width = size.width;
      values.image_height = size.height;
    }
    values.created_at = Date.now();
  }

  const id = insertRow(def.table, values);
  const row = listRows<{ id: number }>(def.table, def.order).find((r) => r.id === id);
  return NextResponse.json({ ok: true, id, row });
}

/** Reordenar: { order: [id, id, …] } */
export async function PUT(req: Request, ctx: Ctx) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const found = await resolve(ctx);
  if (!found) return NextResponse.json({ error: "Recurso desconhecido." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { order?: unknown };
  const order = Array.isArray(body.order) ? body.order.map((v) => Number(v)).filter(Number.isFinite) : [];
  if (!order.length) return NextResponse.json({ error: "Nada para reordenar." }, { status: 400 });

  reorderRows(found.def.table, order);

  if (found.def.id === "pages") {
    // reordenar páginas também renumera os folios (a folha de rosto não leva)
    order.forEach((id, i) => {
      if (i >= 1) updateRowById("pages", id, { folio: i + 3 });
    });
  }

  return NextResponse.json({ ok: true, order });
}
