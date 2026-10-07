import { NextResponse } from "next/server";
import { authenticate, SESSION_COOKIE, sessionCookieOptions, startSession } from "@/lib/auth";
import { ensureDatabase } from "@/db/build";

export const dynamic = "force-dynamic";

/* Login da administradora: e-mail + senha (Argon2id, 64 bytes).
   Sem sucesso não existe sessão; 8 tentativas por 10 minutos por IP. */

const attempts = new Map<string, { count: number; until: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.until < now) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.until < now) attempts.set(ip, { count: 1, until: now + WINDOW });
  else entry.count += 1;
}

export async function POST(req: Request) {
  ensureDatabase();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";

  if (throttled(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429 },
    );
  }

  let email = "";
  let password = "";
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email = String(body.email ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const admin = authenticate(email, password);
  if (!admin) {
    registerFailure(ip);
    // pequena espera: encarece ataques por força bruta
    await new Promise((r) => setTimeout(r, 350));
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  attempts.delete(ip);
  const { token, expiresAt } = startSession(admin.id, req.headers.get("user-agent"));

  const response = NextResponse.json({
    ok: true,
    admin: { email: admin.email, name: admin.name },
    expiresAt,
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
