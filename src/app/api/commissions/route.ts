import { NextResponse } from "next/server";
import { getCommissions } from "@/db/queries";
import {
  getSettings,
  getSettingsDecrypted,
  insertRequest,
  updateRequestDeliveries,
  type NewRequest,
} from "@/db/admin";
import { deliver, type NotifySettings } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** GET /api/commissions → estilos de arte oferecidos (vem do SQLite). */
export async function GET() {
  return NextResponse.json({ types: getCommissions(), open: getSettings().commissions_open === "1" });
}

const LIMITS = { name: 120, email: 160, message: 5000, styles: 40 };

function notifySettings(): NotifySettings {
  // getSettingsDecrypted: o webhook e a senha de SMTP saem do cofre AES-GCM
  const s = getSettingsDecrypted();
  return {
    commission_email: s.commission_email ?? "",
    discord_enabled: s.discord_enabled ?? "0",
    discord_webhook: s.discord_webhook ?? "",
    discord_username: s.discord_username ?? "Atelier Girassol",
    smtp_enabled: s.smtp_enabled ?? "0",
    smtp_host: s.smtp_host ?? "",
    smtp_port: s.smtp_port ?? "587",
    smtp_secure: s.smtp_secure ?? "0",
    smtp_user: s.smtp_user ?? "",
    smtp_pass: s.smtp_pass ?? "",
    smtp_from: s.smtp_from ?? "",
  };
}

/**
 * POST /api/commissions
 * Recebe o formulário do site: grava o pedido na caixa de entrada
 * (sempre) e avisa por Discord/e-mail quando configurado.
 */
export async function POST(req: Request) {
  const settings = getSettings();
  if (settings.commissions_open !== "1") {
    return NextResponse.json(
      { error: "As comissões estão fechadas no momento." },
      { status: 409 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // campo-armadilha: só robôs preenchem
  if (String(body.website ?? "").trim() !== "") {
    return NextResponse.json({ ok: true, id: 0, delivered: { discord: false, email: false } });
  }

  const name = String(body.name ?? "").trim().slice(0, LIMITS.name);
  const email = String(body.email ?? "").trim().slice(0, LIMITS.email);
  const message = String(body.message ?? "").trim().slice(0, LIMITS.message);
  const slugs = Array.isArray(body.styles) ? body.styles.map((s) => String(s)).slice(0, LIMITS.styles) : [];

  if (!name) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  if (slugs.length === 0) {
    return NextResponse.json({ error: "Escolha ao menos um estilo." }, { status: 400 });
  }

  // preços vêm do banco, nunca do navegador
  const catalogue = getCommissions();
  const styles = slugs
    .map((slug) => catalogue.find((c) => c.slug === slug))
    .filter((c): c is { slug: string; name: string; price: number } => !!c);
  if (!styles.length) {
    return NextResponse.json({ error: "Estilos escolhidos não existem mais no catálogo." }, { status: 400 });
  }

  const total = styles.reduce((acc, s) => acc + s.price, 0);
  const input: NewRequest = {
    name,
    email,
    message,
    styles,
    total,
    user_agent: req.headers.get("user-agent"),
  };

  const id = insertRequest(input);
  const request = { id, ...input, createdAt: Date.now() };

  const result = await deliver(request, notifySettings());
  updateRequestDeliveries(id, {
    discord_ok: result.discord.ok,
    email_ok: result.email.ok,
    error: [result.discord.error, result.email.error].filter(Boolean).join(" · ") || null,
  });

  return NextResponse.json({
    ok: true,
    id,
    total,
    delivered: { discord: result.discord.ok, email: result.email.ok },
  });
}
