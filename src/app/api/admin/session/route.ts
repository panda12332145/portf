import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, endSession } from "@/lib/auth";
import { currentToken, currentUser } from "@/lib/admin/guard";
import { countNewRequests, getSettings } from "@/db/admin";
import { getBook } from "@/db/queries";

export const dynamic = "force-dynamic";

/** Quem está logado (usado pelo painel ao carregar). */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  let bookTitle: string | null = null;
  try {
    bookTitle = getBook().book.title;
  } catch {
    bookTitle = null;
  }

  return NextResponse.json({
    user,
    settings: {
      commissions_open: getSettings().commissions_open === "1",
      newRequests: countNewRequests(),
      bookTitle,
    },
  });
}

/** Sair (encerra a sessão no banco e apaga o cookie). */
export async function DELETE() {
  const token = await currentToken();
  endSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
