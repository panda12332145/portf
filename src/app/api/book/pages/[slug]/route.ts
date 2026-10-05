import { NextResponse } from "next/server";
import { getPageBySlug, resetPageLayout, savePageLayout } from "@/db/queries";
import { clampLayout, type PageLayout } from "@/lib/layout";

export const dynamic = "force-dynamic";

const NUMERIC = ["zoom", "offsetX", "offsetY", "rotation", "radius", "platePad"] as const;
const ENUMS = {
  fit: ["contain", "cover"],
  frame: ["plate", "bleed", "none"],
  backdrop: ["blur", "tint", "paper", "none"],
  mountTone: ["paper", "ink"],
} as const;

/** GET /api/book/pages/[slug] */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) return NextResponse.json({ error: "página não encontrada" }, { status: 404 });
  return NextResponse.json(page);
}

/**
 * PATCH /api/book/pages/[slug]
 * Body: { reset?: true } para voltar ao automático, ou
 *       { fit?, frame?, backdrop?, mountTone?, zoom?, offsetX?, offsetY?,
 *         rotation?, radius?, platePad?, shadow? } para ajustar à mão.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.reset === true) {
    const page = resetPageLayout(slug);
    if (!page) return NextResponse.json({ error: "página não encontrada" }, { status: 404 });
    return NextResponse.json({ page, mode: "auto" });
  }

  const patch: Partial<PageLayout> = {};
  for (const key of NUMERIC) {
    if (body[key] !== undefined) patch[key] = Number(body[key]);
  }
  for (const [key, allowed] of Object.entries(ENUMS)) {
    const value = body[key];
    if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
      (patch as Record<string, unknown>)[key] = value;
    }
  }
  if (body.shadow !== undefined) patch.shadow = Boolean(body.shadow);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nenhum campo válido para atualizar" }, { status: 400 });
  }

  const page = savePageLayout(slug, clampLayout(patch));
  if (!page) return NextResponse.json({ error: "página não encontrada" }, { status: 404 });
  return NextResponse.json({ page, mode: "manual" });
}
