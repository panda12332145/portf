import { NextResponse } from "next/server";
import { getBook } from "@/db/queries";

export const dynamic = "force-dynamic";

/** GET /api/book → livro + páginas com o enquadramento gravado no SQLite. */
export async function GET() {
  try {
    const data = getBook();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/book falhou", err);
    return NextResponse.json({ error: "Falha ao carregar o livro" }, { status: 500 });
  }
}
