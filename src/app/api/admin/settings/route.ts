import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import { getSettings, saveSettings } from "@/db/admin";
import { SECRET_SETTING_KEYS } from "@/lib/admin/spec";
import { secretSource } from "@/lib/secrets";

export const dynamic = "force-dynamic";

/**
 * GET  → configurações do estúdio.
 *        Segredos nunca voltam em claro: só um sinalizador.
 * PATCH → grava só as chaves enviadas; segredos são cifrados
 *         com AES-256-GCM antes de ir para o banco.
 */
export async function GET() {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const settings = getSettings();
  const safe: Record<string, string> = {};
  const has: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(settings)) {
    if (SECRET_SETTING_KEYS.includes(key)) has[key] = value !== "";
    else safe[key] = value;
  }

  return NextResponse.json({
    settings: safe,
    secrets: has,
    secretSource: secretSource(),
  });
}

export async function PATCH(req: Request) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const changed = saveSettings(body);

  const settings = getSettings();
  const has: Record<string, boolean> = {};
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (SECRET_SETTING_KEYS.includes(key)) has[key] = value !== "";
    else safe[key] = value;
  }

  return NextResponse.json({ ok: true, changed, settings: safe, secrets: has });
}
