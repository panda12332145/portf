import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import {
  changePassword,
  endOtherSessions,
  passwordProblem,
  updateProfile,
  verifyPassword,
} from "@/lib/auth";
import { countSessionsOf, findAdminByEmail, findAdminById } from "@/db/admin";

export const dynamic = "force-dynamic";

/** Dados da conta (nunca devolve hash, salt nem detalhes de implementação). */
export async function GET() {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const admin = findAdminById(auth.user.id)!;
  return NextResponse.json({
    account: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      createdAt: admin.created_at,
      lastLoginAt: admin.last_login_at,
      sessions: countSessionsOf(admin.id),
    },
  });
}

/** Troca de e-mail, nome e/ou senha (senha atual obrigatória). */
export async function PATCH(req: Request) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const admin = findAdminById(auth.user.id)!;
  const body = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    email?: string;
    name?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const current = String(body.currentPassword ?? "");
  if (!current || !verifyPassword(current, admin)) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const errors: string[] = [];
  const profile: { email?: string; name?: string } = {};

  if (body.email !== undefined) {
    const email = String(body.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail inválido.");
    else {
      const existing = findAdminByEmail(email);
      if (existing && existing.id !== admin.id) errors.push("Já existe uma conta com esse e-mail.");
      else if (email !== admin.email) profile.email = email;
    }
  }
  if (body.name !== undefined) profile.name = String(body.name).trim();

  const wantsNewPassword = body.newPassword !== undefined && body.newPassword !== "";
  if (wantsNewPassword) {
    const password = String(body.newPassword);
    const problem = passwordProblem(password);
    if (problem) errors.push(problem);
    else if (body.confirmPassword !== undefined && body.confirmPassword !== password) {
      errors.push("A confirmação não confere com a nova senha.");
    }
  }

  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  if (Object.keys(profile).length) updateProfile(admin.id, profile);
  if (wantsNewPassword) {
    changePassword(admin.id, String(body.newPassword));
    endOtherSessions(admin.id, auth.token);
  }

  return NextResponse.json({
    ok: true,
    account: { email: profile.email ?? admin.email, name: profile.name ?? admin.name },
    changed: {
      profile: Object.keys(profile).length > 0,
      password: wantsNewPassword,
    },
  });
}
