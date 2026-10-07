import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Batida de saúde pública: só o essencial, sem detalhes internos. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
