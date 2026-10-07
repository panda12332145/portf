import nodemailer from "nodemailer";
import { brl } from "./cn";

/* ==================================================================
 *  Entrega dos pedidos de comissão
 *  • Discord  → webhook (guardado cifrado no SQLite)
 *  • E-mail   → SMTP opcional (nodemailer é JS puro, sem compilação)
 *  Nenhum dos dois é obrigatório: o pedido sempre fica na caixa de
 *  entrada do painel, mesmo que a entrega falhe.
 * ================================================================== */

export interface NotifiableRequest {
  id: number;
  name: string;
  email: string;
  message: string;
  styles: { slug: string; name: string; price: number }[];
  total: number;
  createdAt: number;
}

export interface NotifySettings {
  commission_email: string;
  discord_enabled: string;
  discord_webhook: string;
  discord_username: string;
  smtp_enabled: string;
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
}

export interface DeliveryResult {
  discord: { ok: boolean; skipped?: boolean; error?: string };
  email: { ok: boolean; skipped?: boolean; error?: string };
}

const truthy = (v: string | undefined) => v === "1" || v === "true";

export function stylesSummary(styles: { name: string; price: number }[]): string {
  return styles.map((s) => `${s.name} (${brl(s.price)})`).join(", ");
}

/* ------------------------------ Discord --------------------------- */

export async function sendDiscord(
  request: NotifiableRequest,
  settings: NotifySettings,
  webhookOverride?: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const url = webhookOverride || settings.discord_webhook;
  if (!url || (!webhookOverride && !truthy(settings.discord_enabled))) {
    return { ok: false, skipped: true, error: "webhook não configurado" };
  }
  // o webhook precisa ser https (Discord) — ou um endereço local, para testes
  let local = false;
  try {
    const parsed = new URL(url);
    local = parsed.protocol === "http:" && ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
  } catch {
    local = false;
  }
  if (!url.startsWith("https://") && !local) {
    return { ok: false, error: "A URL do webhook precisa começar com https://" };
  }

  const when = new Date(request.createdAt).toLocaleString("pt-BR");
  const payload = {
    username: settings.discord_username || "Atelier Girassol",
    embeds: [
      {
        title: `Nova comissão — ${request.name}`,
        color: 0xffcb3d,
        description: request.message ? request.message.slice(0, 3500) : "_sem descrição_",
        fields: [
          { name: "E-mail", value: request.email || "—", inline: true },
          { name: "Estimativa", value: brl(request.total), inline: true },
          { name: "Estilos", value: stylesSummary(request.styles).slice(0, 1000) || "—" },
          { name: "Recebido em", value: when, inline: true },
          { name: "Pedido nº", value: `#${request.id}`, inline: true },
        ],
        footer: { text: "Atelier Girassol · formulário do site" },
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Discord respondeu ${res.status} ${text.slice(0, 160)}`.trim() };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "falha de rede" };
  }
}

/* ------------------------------- e-mail --------------------------- */

export function mailBody(request: NotifiableRequest): { text: string; html: string } {
  const styles = request.styles.length ? stylesSummary(request.styles) : "—";
  const when = new Date(request.createdAt).toLocaleString("pt-BR");
  const text = [
    `Nova comissão pelo site (#${request.id})`,
    "",
    `Nome: ${request.name}`,
    `E-mail: ${request.email}`,
    `Estilos: ${styles}`,
    `Estimativa: ${brl(request.total)}`,
    `Recebido em: ${when}`,
    "",
    "Descrição:",
    request.message || "(sem descrição)",
  ].join("\n");

  const esc = (v: string) =>
    v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#25170a">
  <h2 style="margin:0 0 4px">Nova comissão pelo site</h2>
  <p style="margin:0 0 16px;color:#7a6233">pedido #${request.id} · ${esc(when)}</p>
  <table style="border-collapse:collapse">
    <tr><td style="padding:2px 12px 2px 0"><b>Nome</b></td><td>${esc(request.name)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0"><b>E-mail</b></td><td><a href="mailto:${esc(request.email)}">${esc(request.email)}</a></td></tr>
    <tr><td style="padding:2px 12px 2px 0"><b>Estilos</b></td><td>${esc(styles)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0"><b>Estimativa</b></td><td>${brl(request.total)}</td></tr>
  </table>
  <p style="white-space:pre-wrap;margin:16px 0 0">${esc(request.message || "(sem descrição)")}</p>
</div>`;

  return { text, html };
}

export async function sendEmail(
  request: NotifiableRequest,
  settings: NotifySettings,
  toOverride?: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!truthy(settings.smtp_enabled) && !toOverride) {
    return { ok: false, skipped: true, error: "SMTP não configurado" };
  }
  if (!settings.smtp_host) {
    return { ok: false, skipped: true, error: "servidor SMTP não informado" };
  }

  const to = toOverride || settings.commission_email;
  if (!to) return { ok: false, skipped: true, error: "e-mail de destino não configurado" };

  try {
    const transport = nodemailer.createTransport({
      host: settings.smtp_host,
      port: Number(settings.smtp_port) || 587,
      secure: truthy(settings.smtp_secure),
      auth: settings.smtp_user ? { user: settings.smtp_user, pass: settings.smtp_pass } : undefined,
      connectionTimeout: 12_000,
    });
    const body = mailBody(request);
    await transport.sendMail({
      from: settings.smtp_from || settings.smtp_user || to,
      to,
      replyTo: request.email || undefined,
      subject: `Nova comissão — ${request.name} (#${request.id})`,
      text: body.text,
      html: body.html,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "falha ao enviar" };
  }
}

export async function deliver(
  request: NotifiableRequest,
  settings: NotifySettings,
): Promise<DeliveryResult> {
  const [discord, email] = await Promise.all([
    sendDiscord(request, settings).catch((err) => ({
      ok: false,
      error: err instanceof Error ? err.message : "erro",
    })),
    sendEmail(request, settings).catch((err) => ({
      ok: false,
      error: err instanceof Error ? err.message : "erro",
    })),
  ]);
  return { discord, email };
}
