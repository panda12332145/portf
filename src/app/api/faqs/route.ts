import { NextResponse } from "next/server";
import { getFaqs } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ faqs: await getFaqs() });
}
