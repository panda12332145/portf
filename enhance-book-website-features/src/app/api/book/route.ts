import { NextResponse } from "next/server";
import { getBookWithArts } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getBookWithArts();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/book failed", err);
    return NextResponse.json({ error: "Falha ao carregar o livro" }, { status: 500 });
  }
}
