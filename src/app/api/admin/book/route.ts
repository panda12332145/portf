import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import { sqlite } from "@/db/queries";
import type { BookRow } from "@/db/schema";
import { autoLayout, clampLayout, type PageLayout } from "@/lib/layout";
import { dimensionsOf } from "@/lib/upload";

export const dynamic = "force-dynamic";

/** Ficha do livro (título, autor, capa, dedicatória, enquadramento da capa). */

const COLS: Record<string, string> = {
  slug: "slug",
  title: "title",
  subtitle: "subtitle",
  author: "author",
  publisher: "publisher",
  edition: "edition",
  description: "description",
  dedication: "dedication",
  spineLabel: "spine_label",
  coverImage: "cover_image",
  coverArtTitle: "cover_art_title",
  coverLayout: "cover_layout",
};

export async function GET() {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const book = sqlite.get<BookRow>(`SELECT * FROM books ORDER BY id LIMIT 1`);
  if (!book) return NextResponse.json({ error: "Banco sem livro." }, { status: 404 });
  return NextResponse.json({ book });
}

export async function PATCH(req: Request) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const sets: string[] = [];
  const params: Record<string, string | number | null> = { now: Date.now() };

  for (const [key, raw] of Object.entries(body)) {
    const col = COLS[key];
    if (!col) continue;

    if (key === "coverLayout") {
      const hasImage = typeof body.coverImage === "string" ? String(body.coverImage) : null;
      if (raw === "auto") {
        const size = dimensionsOf(
          hasImage ?? sqlite.get<{ cover_image: string }>(`SELECT cover_image FROM books LIMIT 1`)!.cover_image,
        );
        const layout: PageLayout = {
          ...clampLayout(autoLayout(size)),
          fit: "cover",
          frame: "none",
          backdrop: "none",
          mountTone: size && size.width / size.height > 1.4 ? "ink" : "paper",
          platePad: 0,
        };
        sets.push(`cover_layout = @coverLayout`);
        params.coverLayout = JSON.stringify(layout);
      } else if (raw && typeof raw === "object") {
        sets.push(`cover_layout = @coverLayout`);
        params.coverLayout = JSON.stringify(clampLayout(raw as Partial<PageLayout>));
      }
      continue;
    }

    sets.push(`${col} = @${key}`);
    params[key] = raw === null || raw === undefined ? "" : String(raw);
  }

  if (!sets.length) return NextResponse.json({ ok: true, changed: 0 });

  sets.push(`updated_at = @now`);
  sqlite.run(`UPDATE books SET ${sets.join(", ")} WHERE id = (SELECT id FROM books ORDER BY id LIMIT 1)`, params);

  const book = sqlite.get<BookRow>(`SELECT * FROM books ORDER BY id LIMIT 1`);
  return NextResponse.json({ ok: true, changed: sets.length - 1, book });
}
