import { NextResponse } from "next/server";
import { getArtworks } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ artworks: await getArtworks() });
}
