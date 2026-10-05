import { NextResponse } from "next/server";
import { getBook } from "@/db/queries";
import { dbPath } from "@/db/build";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { book, pages } = getBook();
    return NextResponse.json({
      ok: true,
      database: dbPath(),
      book: { slug: book.slug, title: book.title },
      pages: pages.length,
      layoutsAutomáticos: pages.filter((p) => p.layoutAuto).length,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
