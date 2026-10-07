import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import { getRequest, getSettingsDecrypted, updateRequestDeliveries } from "@/db/admin";
import { sendDiscord, sendEmail, type NotifySettings } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** POST { kind: "discord" | "email", target?, requestId? } → mensagem de teste ou reenvio real. */
export async function POST(req: Request) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const { kind, target, requestId } = (await req.json().catch(() => ({}))) as {
    kind?: "discord" | "email";
    target?: string;
    requestId?: number;
  };

  const stored = getSettingsDecrypted();
  const settings: NotifySettings = {
    commission_email: stored.commission_email ?? "",
    discord_enabled: "1",
    discord_webhook: stored.discord_webhook ?? "",
    discord_username: stored.discord_username ?? "Atelier Girassol",
    smtp_enabled: stored.smtp_enabled ?? "0",
    smtp_host: stored.smtp_host ?? "",
    smtp_port: stored.smtp_port ?? "587",
    smtp_secure: stored.smtp_secure ?? "0",
    smtp_user: stored.smtp_user ?? "",
    smtp_pass: stored.smtp_pass ?? "",
    smtp_from: stored.smtp_from ?? "",
  };

  const demo = {
    id: 0,
    name: "Teste do painel",
    email: target || settings.commission_email || "teste@ateliergirassol.art",
    message: "Se você está vendo esta mensagem, a entrega das comissões está funcionando. ✳",
    styles: [{ slug: "sketch", name: "Sketch (teste)", price: 60 }],
    total: 60,
    createdAt: Date.now(),
  };

  if (kind === "discord") {
    // reenvio de um pedido real, quando o painel pede (requestId)
    const original = typeof requestId === "number" ? getRequest(requestId) : null;
    if (requestId !== undefined && !original) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    const payload = original
      ? {
          id: original.id,
          name: original.name,
          email: original.email,
          message: original.message,
          styles: original.styles,
          total: original.total,
          createdAt: original.createdAt,
        }
      : demo;

    const result = await sendDiscord(payload, settings, stored.discord_webhook || undefined);
    if (original) {
      updateRequestDeliveries(original.id, {
        discord_ok: result.ok,
        error: result.ok ? null : (result.error ?? "Falha no reenvio para o Discord."),
      });
    }
    if (result.ok) {
      return NextResponse.json({
        ok: true,
        detail: original ? "Pedido reenviado para o Discord." : "Mensagem enviada para o Discord.",
      });
    }
    return NextResponse.json(
      { error: result.error ?? "Não foi possível enviar para o Discord." },
      { status: 400 },
    );
  }

  const to = target?.trim() || settings.commission_email;
  if (!to) return NextResponse.json({ error: "Informe um e-mail de destino." }, { status: 400 });

  if (!settings.smtp_host) {
    return NextResponse.json(
      {
        error:
          "Configure o servidor SMTP acima (e ative o envio por e-mail) para testar. Sem SMTP, os pedidos ficam sempre na caixa de entrada do painel.",
      },
      { status: 400 },
    );
  }

  const result = await sendEmail(demo, settings, to);
  if (result.ok) return NextResponse.json({ ok: true, detail: `E-mail de teste enviado para ${to}.` });
  return NextResponse.json({ error: result.error ?? "Falha ao enviar o e-mail." }, { status: 400 });
}
