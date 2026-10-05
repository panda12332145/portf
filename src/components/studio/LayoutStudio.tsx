"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CornerDownLeft,
  ImageOff,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { LAYOUT_LABELS, aspectOf, type PageLayout } from "@/lib/layout";
import type { BookMeta, BookPage } from "@/lib/types";
import PagePreview from "./PagePreview";

/* ------------------------------------------------------------------ */

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block py-1.5">
      <span className="flex items-baseline justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-cream/50">
        {label}
        <span className="tabular-nums text-cream/80">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<string, string>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block py-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cream/50">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-cream/15 bg-soil-800 px-3 py-2 text-sm text-cream outline-none transition focus:border-sun-400/60"
      >
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k} className="bg-soil-800">
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

const orientation = (w: number | null, h: number | null) => {
  if (!w || !h) return "sem imagem";
  const ar = w / h;
  if (ar >= 1.9) return "panorâmica";
  if (ar >= 1.15) return "paisagem";
  if (ar <= 0.72) return "retrato";
  return "quadrada";
};

/* ------------------------------------------------------------------ */

export default function LayoutStudio({ book, pages: initial }: { book: BookMeta; pages: BookPage[] }) {
  const [pages, setPages] = useState(initial);
  const [selected, setSelected] = useState(initial.find((p) => p.image)?.slug ?? initial[0]?.slug);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"idle" | "ok" | "erro">("idle");
  const [flash, setFlash] = useState<string | null>(null);

  const page = pages.find((p) => p.slug === selected) ?? pages[0];
  const ilustradas = pages.filter((p) => p.image).length;

  const setLayout = (patch: Partial<PageLayout>) =>
    setPages((prev) =>
      prev.map((p) => (p.slug === page.slug ? { ...p, layout: { ...p.layout, ...patch } } : p)),
    );

  const dirty = useMemo(() => {
    const original = initial.find((p) => p.slug === page?.slug);
    return original ? JSON.stringify(original.layout) !== JSON.stringify(page.layout) : false;
  }, [initial, page]);

  const sql = useMemo(() => {
    const l = page.layout;
    return [
      `UPDATE pages SET`,
      `  fit = '${l.fit}', frame = '${l.frame}', backdrop = '${l.backdrop}',`,
      `  mount_tone = '${l.mountTone}', zoom = ${l.zoom},`,
      `  offset_x = ${l.offsetX}, offset_y = ${l.offsetY},`,
      `  rotation = ${l.rotation}, radius = ${l.radius}, plate_pad = ${l.platePad},`,
      `  shadow = ${l.shadow ? 1 : 0}, layout_auto = 0`,
      `WHERE slug = '${page.slug}';`,
    ].join("\n");
  }, [page]);

  const save = async (reset = false) => {
    setSaving(true);
    setSaved("idle");
    try {
      const res = await fetch(`/api/book/pages/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset ? { reset: true } : page.layout),
      });
      if (!res.ok) throw new Error(await res.text());
      const { page: updated } = (await res.json()) as { page: BookPage };
      setPages((prev) => prev.map((p) => (p.slug === updated.slug ? updated : p)));
      setSaved("ok");
      setFlash(reset ? "Enquadramento recalculado pelo SQLite." : "Gravado no SQLite.");
      setTimeout(() => setFlash(null), 2600);
    } catch (err) {
      console.error(err);
      setSaved("erro");
      setFlash("Não foi possível gravar — veja o console.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved("idle"), 2400);
    }
  };

  if (!page) {
    return <p className="p-10 text-sm text-cream/60">Nenhuma página no banco. Rode `npm run db:build`.</p>;
  }

  return (
    <div className="scope-dark min-h-screen bg-soil-900 pb-20">
      {/* topo */}
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-soil-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-cream/45 transition hover:text-cream"
            >
              <ArrowLeft size={12} /> voltar ao site
            </Link>
            <h1 className="mt-1 font-display text-2xl text-cream">Estúdio de enquadramento</h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cream/40">
              {book.title} · {pages.length} páginas · {ilustradas} com ilustração
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md border border-cream/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cream/75 transition hover:border-cream/40 hover:text-cream disabled:opacity-40"
            >
              <Sparkles size={13} /> Recalcular automático
            </button>
            <button
              onClick={() => save(false)}
              disabled={saving || !dirty}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition",
                dirty
                  ? "bg-sun-400 text-ink hover:bg-sun-300"
                  : "cursor-not-allowed bg-cream/10 text-cream/40",
              )}
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : saved === "ok" ? (
                <Check size={13} />
              ) : (
                <Save size={13} />
              )}
              Salvar no banco
            </button>
          </div>
        </div>
        {flash && (
          <p className="border-t border-sun-400/20 bg-sun-400/10 px-5 py-1.5 text-center text-[11px] text-sun-200 md:px-8">
            {flash}
          </p>
        )}
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 pt-8 md:px-8 lg:grid-cols-[260px_1fr_320px]">
        {/* lista de páginas */}
        <aside className="order-2 lg:order-1">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-cream/40">
            Páginas do livro
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
            {pages.map((p) => {
              const active = p.slug === page.slug;
              return (
                <li key={p.slug}>
                  <button
                    onClick={() => setSelected(p.slug)}
                    className={cn(
                      "w-full overflow-hidden rounded-md border text-left transition",
                      active
                        ? "border-sun-400/70 bg-sun-400/10"
                        : "border-cream/10 bg-soil-800/60 hover:border-cream/30",
                    )}
                  >
                    <span className="flex h-24 w-full items-center justify-center overflow-hidden bg-[#efe4cb]">
                      {p.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-[#a8843e]" />
                      )}
                    </span>
                    <span className="block px-2 py-1.5">
                      <span className="block truncate text-[11px] font-semibold text-cream">
                        {String(p.order).padStart(2, "0")} · {p.title}
                      </span>
                      <span className="block text-[9px] uppercase tracking-wider text-cream/40">
                        {p.layoutAuto ? "automático" : "ajustado à mão"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* pré-visualização */}
        <section className="order-1 lg:order-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-cream">{page.title}</h2>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cream/40">
                {page.type || page.kind} ·{" "}
                {orientation(page.imageWidth, page.imageHeight)}
                {page.imageWidth ? ` · ${page.imageWidth}×${page.imageHeight}` : ""}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                page.layoutAuto
                  ? "border-leaf-500/40 bg-leaf-500/10 text-leaf-500"
                  : "border-sun-400/40 bg-sun-400/10 text-sun-300",
              )}
            >
              {page.layoutAuto ? "automático" : "manual"}
            </span>
          </div>

          <div className="mt-5 flex justify-center">
            <PagePreview
              book={book}
              page={page}
              className="w-full max-w-[420px] rounded-md border border-cream/15 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)]"
            />
          </div>

          <p className="mt-3 text-center text-[11px] text-cream/35">
            esta é a mesma textura 1024×1350 usada na folha 3D — nada é simulado à parte
          </p>

          <details className="mt-6 rounded-md border border-cream/10 bg-soil-800/60 p-4">
            <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cream/50">
              <CornerDownLeft size={12} /> SQL equivalente (dá para ajustar direto no banco)
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre rounded bg-black/40 p-3 text-[11px] leading-relaxed text-sun-100/80">
              {sql}
            </pre>
            <p className="mt-2 text-[11px] text-cream/40">
              {"/estudio"} grava exatamente estas colunas. Depois de um ajuste manual, a página
              deixa de ser recalculada no build (layout_auto = 0).
            </p>
          </details>
        </section>

        {/* controles */}
        <aside className="order-3">
          <div className="rounded-lg border border-cream/10 bg-soil-800/60 p-4">
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-cream/40">
              Enquadramento
            </h2>

            <Select
              label="Ajuste da imagem"
              options={LAYOUT_LABELS.fit}
              value={page.layout.fit}
              onChange={(v) => setLayout({ fit: v as PageLayout["fit"] })}
            />
            <Select
              label="Moldura"
              options={LAYOUT_LABELS.frame}
              value={page.layout.frame}
              onChange={(v) => setLayout({ frame: v as PageLayout["frame"] })}
            />
            <Select
              label="Fundo"
              options={LAYOUT_LABELS.backdrop}
              value={page.layout.backdrop}
              onChange={(v) => setLayout({ backdrop: v as PageLayout["backdrop"] })}
            />
            <Select
              label="Tom da moldura"
              options={LAYOUT_LABELS.mountTone}
              value={page.layout.mountTone}
              onChange={(v) => setLayout({ mountTone: v as PageLayout["mountTone"] })}
            />

            <div className="my-3 h-px bg-cream/10" />

            <Slider
              label="Zoom"
              value={page.layout.zoom}
              min={0.4}
              max={2.5}
              step={0.01}
              suffix="×"
              onChange={(v) => setLayout({ zoom: v })}
            />
            <Slider
              label="Deslocar ↕"
              value={page.layout.offsetY}
              min={-45}
              max={45}
              step={0.5}
              suffix="%"
              onChange={(v) => setLayout({ offsetY: v })}
            />
            <Slider
              label="Deslocar ↔"
              value={page.layout.offsetX}
              min={-45}
              max={45}
              step={0.5}
              suffix="%"
              onChange={(v) => setLayout({ offsetX: v })}
            />
            <Slider
              label="Diagonal"
              value={page.layout.rotation}
              min={-18}
              max={18}
              step={0.25}
              suffix="°"
              onChange={(v) => setLayout({ rotation: v })}
            />
            <Slider
              label="Cantos"
              value={page.layout.radius}
              min={0}
              max={90}
              step={1}
              suffix="px"
              onChange={(v) => setLayout({ radius: v })}
            />
            <Slider
              label="Respiro da moldura"
              value={page.layout.platePad}
              min={0}
              max={120}
              step={1}
              suffix="px"
              onChange={(v) => setLayout({ platePad: v })}
            />

            <label className="mt-3 flex items-center gap-2.5 text-xs text-cream/70">
              <input
                type="checkbox"
                checked={page.layout.shadow}
                onChange={(e) => setLayout({ shadow: e.target.checked })}
                className="h-3.5 w-3.5 accent-[#ffcb3d]"
              />
              Sombra da moldura
            </label>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => save(false)}
                disabled={saving || !dirty}
                className={cn(
                  "flex-1 rounded-md py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition",
                  dirty ? "bg-sun-400 text-ink hover:bg-sun-300" : "bg-cream/10 text-cream/40",
                )}
              >
                {saving ? "salvando…" : "salvar"}
              </button>
              <button
                onClick={() => {
                  const original = initial.find((p) => p.slug === page.slug);
                  if (original) setPages((prev) => prev.map((p) => (p.slug === page.slug ? original : p)));
                }}
                disabled={!dirty}
                className="rounded-md border border-cream/15 p-2.5 text-cream/60 transition hover:text-cream disabled:opacity-30"
                aria-label="Descartar alterações"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {saved === "erro" && <p className="mt-2 text-[11px] text-red-400">erro ao gravar</p>}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-cream/40">
            Dica: imagens deitadas ganham respiro maior e fundo desfocado automaticamente; em pé,
            recebem moldura mais estreita e cantos maiores. <strong>Salvar</strong> marca a página
            como manual — use <strong>Recalcular automático</strong> para voltar ao cálculo do
            banco.
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-cream/40">
            Para incluir novas artes: jogue os arquivos em <code>public/book/</code> e rode{" "}
            <code>npm run db:import</code> — o enquadramento é calculado e gravado no SQLite.
          </p>
        </aside>
      </div>
    </div>
  );
}
