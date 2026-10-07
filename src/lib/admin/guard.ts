import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionUser, type SessionUser } from "../auth";

/* Sessão da administradora para Server Components e Route Handlers. */

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return sessionUser(jar.get(SESSION_COOKIE)?.value);
}

export async function currentToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Sessão expirada. Entre de novo para continuar." },
    { status: 401 },
  );
}

/** Usado no começo de toda rota /api/admin/* (menos login e sessão). */
export async function guard(): Promise<
  { ok: true; user: SessionUser; token: string } | { ok: false; response: NextResponse }
> {
  const token = await currentToken();
  const user = sessionUser(token);
  if (!user || !token) return { ok: false, response: unauthorized() };
  return { ok: true, user, token };
}
