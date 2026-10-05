import { NextResponse } from "next/server";
import { getCommissions } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ commissions: await getCommissions() });
}
