"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  HelpCircle,
  Images,
  Inbox,
  Lock,
  Unlock,
} from "lucide-react";
import type { TabId } from "../AdminPanel";
import { Btn, Card, Status, apiGet, apiSend, useStatus } from "../fields";
import { cn } from "@/lib/cn";

interface Countable {
  id: number;
}

export default function Overview({
  admin,
  onGo,
}: {
  admin: { email: string; name: string };
  onGo: (tab: TabId) => void;
}) {
  const status = useStatus();
  const [open, setOpen] = useState<boolean | null>(null);
  const [bookTitle, setBookTitle] = useState<string | null>(null);
  const [counts, setCounts] = useState({ obras: 0, paginas: 0, faq: 0, estilos: 0, novos: 0 });

  useEffect(() => {
    void apiGet<{ settings?: { commissions_open?: boolean; bookTitle?: string | null } }>(
      "/api/admin/session",
    ).then((res) => {
      if (res.ok && res.data?.settings) {
        setOpen(!!res.data.settings.commissions_open);
        setBookTitle(res.data.settings.bookTitle ?? null);
      }
    });

    void (async () => {
      const [art, pages, faq, styles, req] = await Promise.all([
        apiGet<{ rows: Countable[] }>("/api/admin/resources/artworks"),
        apiGet<{ rows: Countable[] }>("/api/admin/resources/pages"),
        apiGet<{ rows: Countable[] }>("/api/admin/resources/faqs"),
        apiGet<{ rows: Countable[] }>("/api/admin/resources/styles"),
        apiGet<{ rows: { status: string }[] }>("/api/admin/resources/requests"),
      ]);
      setCounts({
        obras: art.data?.rows.length ?? 0,
        paginas: pages.data?.rows.length ?? 0,
        faq: faq.data?.rows.length ?? 0,
        estilos: styles.data?.rows.length ?? 0,
        novos: (req.data?.rows ?? []).filter((r) => r.status === "novo").length,
      });
    })();
  }, []);

  const toggleCommissions = async () => {
    const next = !open;
    const res = await apiSend("/api/admin/settings", "PATCH", { commissions_open: next ? "1" : "0" });
    if (res.ok) {
      setOpen(next);
      status.say(next ? "Comissões abertas." : "Comissões fechadas.");
    } else status.fail(res.error ?? "Não foi possível salvar.");
  };

  const cards: { label: string; value: number; tab: TabId; Icon: typeof Images }[] = [
    { label: "Obras no acervo", value: counts.obras, tab: "obras", Icon: Images },
    { label: "Páginas do livro", value: counts.paginas, tab: "livro", Icon: BookOpen },
    { label: "Perguntas no FAQ", value: counts.faq, tab: "faq", Icon: HelpCircle },
    { label: "Estilos de arte", value: counts.estilos, tab: "comissoes", Icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream">
          Olá, {admin.name || admin.email.split("@")[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
          Daqui você edita tudo o que aparece no site: textos, imagens, preços, perguntas, obras e o
          livro. O que for salvo nesta tela já está visível para quem visita.
        </p>
      </div>

      <Status error={status.error} ok={status.ok} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, tab, Icon }) => (
          <button
            key={label}
            onClick={() => onGo(tab)}
            className="group rounded-xl border border-cream/12 bg-cream/[0.03] p-5 text-left transition-colors hover:border-sun-400/50"
          >
            <Icon size={16} className="text-sun-300/80" />
            <p className="mt-4 font-display text-4xl font-medium tabular-nums tracking-tight text-cream">
              {value}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cream/45">
              {label}
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Comissões"
          hint="Quando fechadas, o formulário do site é substituído pela sua mensagem — o catálogo de estilos e os preços continuam visíveis."
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em]",
                open
                  ? "border-leaf-500/50 bg-leaf-500/15 text-cream"
                  : "border-cream/20 bg-cream/5 text-cream/60",
              )}
            >
              {open ? <Unlock size={12} /> : <Lock size={12} />}
              {open === null ? "..." : open ? "Abertas" : "Fechadas"}
            </span>
            <Btn variant={open ? "outline" : "gold"} onClick={toggleCommissions} disabled={open === null}>
              {open ? "Fechar comissões" : "Abrir comissões"}
            </Btn>
            <Btn variant="ghost" onClick={() => onGo("comissoes")}>
              Preços, e-mail e avisos
            </Btn>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-cream/10 pt-5">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cream/50">
              <Inbox size={13} /> {counts.novos} pedido(s) novo(s)
            </span>
            <Btn variant="outline" size="sm" onClick={() => onGo("mensagens")}>
              Abrir mensagens
            </Btn>
          </div>
        </Card>

        <Card
          title="Livro em exposição"
          hint="A ficha e as páginas do livro são editadas na aba Livro; o enquadramento fino, no estúdio visual."
        >
          <div className="flex items-start gap-3">
            <BookOpen size={18} className="mt-1 shrink-0 text-sun-300/70" />
            <div>
              <p className="font-display text-xl font-medium tracking-tight text-cream">
                {bookTitle ?? "—"}
              </p>
              <p className="mt-1 text-[12px] text-cream/50">
                {counts.paginas} página(s) no miolo, lidas na ordem cadastrada.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-cream/10 pt-5">
            <Link
              href="/estudio"
              className="inline-flex items-center gap-2 rounded-md bg-sun-400 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-sun-300"
            >
              Estúdio de enquadramento <ArrowRight size={13} />
            </Link>
            <Link
              href="/galeria"
              className="inline-flex items-center gap-2 rounded-md border border-cream/25 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cream transition hover:border-cream/60"
            >
              Ver galeria
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
