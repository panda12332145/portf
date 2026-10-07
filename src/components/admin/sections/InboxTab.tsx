"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, Mail, MailOpen, RefreshCw, Trash2 } from "lucide-react";
import { Btn, Card, Pick, Status, apiSend, useResource, useStatus, type Row } from "../fields";
import { brl } from "@/lib/cn";

/* ==================================================================
 *  Mensagens — cada pedido enviado pelo formulário do site
 * ================================================================== */

interface RequestRow extends Row {
  name: string;
  email: string;
  message: string;
  styles: string | null;
  total: number;
  status: string;
  discord_ok: number;
  email_ok: number;
  error: string | null;
  user_agent: string | null;
  created_at: number;
}

const STATUS = [
  { value: "novo", label: "Novo" },
  { value: "lido", label: "Lido" },
  { value: "respondido", label: "Respondido" },
  { value: "arquivado", label: "Arquivado" },
];

const parseStyles = (raw: string | null): { name: string; price: number }[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function InboxTab() {
  const status = useStatus();
  const requests = useResource<RequestRow>("requests");
  const [openId, setOpenId] = useState<number | null>(null);
  const [resent, setResent] = useState<number | null>(null);

  useEffect(() => {
    if (openId === null && requests.rows.length) {
      const firstNew = requests.rows.find((r) => r.status === "novo");
      if (firstNew) setOpenId(firstNew.id);
    }
  }, [requests.rows, openId]);

  const resendDiscord = async (row: RequestRow) => {
    setResent(row.id);
    const res = await apiSend<{ detail?: string }>("/api/admin/test", "POST", {
      kind: "discord",
      requestId: row.id,
    });
    setResent(null);
    if (res.ok) {
      status.say("Aviso reenviado ao Discord.");
      await requests.load();
    } else status.fail(res.error ?? "Falha ao reenviar.");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream">Mensagens</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
          Todo pedido enviado pelo formulário cai aqui (mesmo que o e-mail ou o Discord falhem). O
          aviso por Discord/e-mail usa as configurações da aba Comissões.
        </p>
      </div>

      <Status error={status.error} ok={status.ok} />

      {requests.rows.length === 0 ? (
        <Card>
          <p className="text-[13px] text-cream/45">
            Nenhum pedido ainda. Quando alguém enviar o formulário, ele aparece aqui com os estilos
            escolhidos e a estimativa.
          </p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {requests.rows.map((row) => {
          const styles = parseStyles(row.styles);
          const open = openId === row.id;
          return (
            <div
              key={row.id}
              className="overflow-hidden rounded-xl border border-cream/12 bg-cream/[0.03]"
            >
              <div className="flex flex-wrap items-center gap-3 p-3">
                <span
                  className={
                    row.status === "novo"
                      ? "inline-flex items-center gap-1.5 rounded-full bg-sun-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink"
                      : "inline-flex items-center gap-1.5 rounded-full border border-cream/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cream/50"
                  }
                >
                  {row.status === "novo" ? <BellRing size={10} /> : <MailOpen size={10} />}
                  {row.status}
                </span>

                <button onClick={() => setOpenId(open ? null : row.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13px] font-semibold text-cream">
                    {row.name} · {row.email}
                  </span>
                  <span className="block truncate text-[11px] text-cream/45">
                    {new Date(row.created_at).toLocaleString("pt-BR")} · {styles.length} estilo(s) ·{" "}
                    {brl(row.total)}
                    {row.discord_ok === 1 ? " · avisado no Discord" : ""}
                    {row.email_ok === 1 ? " · e-mail enviado" : ""}
                  </span>
                </button>

                <a
                  href={`mailto:${row.email}?subject=${encodeURIComponent("Sua comissão no Atelier Girassol")}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-cream/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cream/70 transition hover:border-sun-400/60 hover:text-cream"
                >
                  <Mail size={12} /> Responder
                </a>
              </div>

              {open ? (
                <div className="space-y-4 border-t border-cream/10 p-4">
                  <div className="flex flex-wrap gap-2">
                    {styles.map((s) => (
                      <span
                        key={s.name}
                        className="rounded-full border border-cream/15 bg-soil-900/50 px-3 py-1.5 text-[12px] text-cream/80"
                      >
                        {s.name}
                        <span className="ml-2 text-[11px] tabular-nums text-sun-300/80">{brl(s.price)}</span>
                      </span>
                    ))}
                    <span className="rounded-full border border-sun-400/40 bg-sun-400/10 px-3 py-1.5 text-[12px] font-semibold text-cream">
                      estimativa: {brl(row.total)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-cream/10 bg-soil-900/50 p-3">
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-cream/85">
                      {row.message || "(sem descrição)"}
                    </p>
                  </div>

                  {row.error ? (
                    <p className="text-[11px] leading-relaxed text-red-300/90">
                      Aviso de entrega: {row.error}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="w-40">
                      <Pick
                        value={row.status}
                        onChange={async (v) => {
                          const res = await requests.patch(row.id, { status: v });
                          if (res.ok) status.say(`Pedido marcado como “${v}”.`);
                          else status.fail(res.error ?? "Falha ao atualizar.");
                        }}
                        options={STATUS}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Btn size="sm" variant="outline" onClick={() => void resendDiscord(row)} disabled={resent === row.id}>
                        {resent === row.id ? <RefreshCw size={12} className="animate-spin" /> : <BellRing size={12} />}
                        Reenviar no Discord
                      </Btn>
                      <Btn
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const res = await requests.patch(row.id, { status: "respondido" });
                          if (res.ok) status.say("Marcado como respondido.");
                        }}
                      >
                        <Check size={12} /> Marcar respondido
                      </Btn>
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          const res = await requests.remove(row.id);
                          if (res.ok) {
                            setOpenId(null);
                            status.say("Pedido excluído.");
                          } else status.fail(res.error ?? "Falha ao excluir.");
                        }}
                      >
                        <Trash2 size={12} /> Excluir
                      </Btn>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
