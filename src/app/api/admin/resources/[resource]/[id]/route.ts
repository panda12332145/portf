import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import { RESOURCES, normalizeValues, slugify } from "@/lib/admin/spec";
import { deleteRowById, getRowById, slugTaken, updateRowById } from "@/db/admin";
import { sqlite } from "@/db/queries";
import { autoLayout, clampLayout } from "@/lib/layout";
import { dimensionsOf } from "@/lib/upload";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string; id: string }> };

/** Edita (PATCH) e apaga (DELETE) um registro. */

async function resolve(ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const def = RESOURCES[resource];
  const numericId = Number(id);
  if (!def || !Number.isFinite(numericId)) return null;
  return { def, id: numericId };
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const found = await resolve(ctx);
  if (!found) return NextResponse.json({ error: "Recurso desconhecido." }, { status: 404 });

  const row = getRowById(found.def.table, found.id);
  if (!row) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  return NextResponse.json({ row });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const found = await resolve(ctx);
  if (!found) return NextResponse.json({ error: "Recurso desconhecido." }, { status: 404 });
  const { def, id } = found;

  const existing = getRowById<Record<string, unknown>>(def.table, id);
  if (!existing) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { values, errors } = normalizeValues(def, body, { creating: false });
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  /* ------------------------------ slug ----------------------------- */
  if (def.slugFrom) {
    const wanted = slugify(String(values.slug ?? ""));
    if (wanted && wanted !== existing.slug) {
      if (slugTaken(def.table, wanted, id)) return NextResponse.json({ error: "Slug já usado." }, { status: 400 });
      values.slug = wanted;
    } else if (!wanted && body[def.slugFrom] !== undefined) {
      let slug = slugify(String(body[def.slugFrom]));
      const base = slug || `item-${Date.now().toString(36)}`;
      let attempt = 1;
      slug = base;
      while (slugTaken(def.table, slug, id)) slug = `${base}-${++attempt}`;
      values.slug = slug;
    } else {
      delete values.slug;
    }
  }

  /* --------- páginas do livro: dimensões reais + auto layout ------- */
  if (def.id === "pages") {
    const imageChanged = "image_path" in values && values.image_path !== existing.image_path;
    if (imageChanged) {
      const size = dimensionsOf(values.image_path as string | null);
      values.image_width = size?.width ?? null;
      values.image_height = size?.height ?? null;
    }

    const wantsAuto = values.layout_auto === 1;
    const turnedManual = values.layout_auto === 0;
    if (wantsAuto && (imageChanged || body.recompute === true)) {
      const size = dimensionsOf((values.image_path ?? existing.image_path) as string | null);
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
      });
    }
    // mexe em qualquer ajuste fino → a página deixa de ser automática
    const layoutKeys = ["fit", "frame", "backdrop", "mount_tone", "zoom", "offset_x", "offset_y", "rotation", "radius", "plate_pad", "shadow"];
    if (!wantsAuto && !turnedManual && layoutKeys.some((k) => k in values)) values.layout_auto = 0;

    values.updated_at = Date.now();
  }

  if (def.id === "artworks" && "image_path" in values) {
    const size = dimensionsOf(values.image_path as string | null);
    values.image_width = size?.width ?? null;
    values.image_height = size?.height ?? null;
  }

  if (!Object.keys(values).length) return NextResponse.json({ ok: true, changed: 0 });
  updateRowById(def.table, id, values);

  const row = getRowById(def.table, id);
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const found = await resolve(ctx);
  if (!found) return NextResponse.json({ error: "Recurso desconhecido." }, { status: 404 });

  const existed = getRowById(found.def.table, found.id);
  if (!existed) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });

  deleteRowById(found.def.table, found.id);

  // o livro precisa das páginas em sequência
  if (found.def.id === "pages") {
    sqlite.run(`UPDATE pages SET ord = ord - 1 WHERE ord > @ord`, { ord: Number(existed.ord) || 0 });
  }

  return NextResponse.json({ ok: true, removed: found.id });
}
