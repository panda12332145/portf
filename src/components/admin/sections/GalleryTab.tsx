"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import {
  Area,
  Btn,
  Card,
  Check2,
  Field,
  ImagePicker,
  Lines,
  Num,
  Pick,
  Status,
  Text,
  useResource,
  useStatus,
  type Row,
} from "../fields";
import { cn } from "@/lib/cn";

/* ==================================================================
 *  Obras do site (public/images) — adicionar, mover, editar, excluir
 * ================================================================== */

interface ArtRow extends Row {
  slug: string;
  title: string;
  medium: string;
  year: string;
  image_path: string;
  image_width: number | null;
  image_height: number | null;
  span: number;
  shift: number;
  aspect: string;
  description: string;
  tags: string | null;
  featured: number;
}

const ASPECTS = ["4/5", "3/4", "1/1", "4/3", "16/11", "16/9", "3/2", "2/3"].map((v) => ({
  value: v,
  label: v,
}));

const parseTags = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
};

export default function GalleryTab() {
  const status = useStatus();
  const artworks = useResource<ArtRow>("artworks");
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", medium: "", year: String(new Date().getFullYear()) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream">Obras do site</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
            Estas são as peças da seção “Portfólio” da página inicial e da página Galeria. Elas
            também formam o acervo completo em /galeria (as páginas do livro ficam na aba Livro).
          </p>
        </div>
        <Btn variant="gold" onClick={() => setCreating((c) => !c)}>
          <Plus size={13} /> Nova obra
        </Btn>
      </div>

      <Status error={status.error} ok={status.ok} />

      {creating ? (
        <Card title="Nova obra">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Título">
              <Text value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
            </Field>
            <Field label="Técnica">
              <Text value={draft.medium} onChange={(v) => setDraft((d) => ({ ...d, medium: v }))} placeholder="Aquarela sobre papel" />
            </Field>
            <Field label="Ano">
              <Text value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Btn>
            <Btn
              variant="gold"
              onClick={async () => {
                if (!draft.title.trim()) return status.fail("A obra precisa de um título.");
                const res = await artworks.create({
                  title: draft.title.trim(),
                  medium: draft.medium.trim(),
                  year: draft.year.trim(),
                  aspect: "4/5",
                  span: 6,
                  shift: 0,
                  tags: [],
                  featured: false,
                  description: "",
                  imagePath: "",
                });
                if (res.ok) {
                  setDraft({ title: "", medium: "", year: String(new Date().getFullYear()) });
                  setCreating(false);
                  status.say("Obra criada — agora escolha a imagem e a moldura.");
                } else status.fail(res.error ?? "Falha ao criar.");
              }}
            >
              <Save size={13} /> Criar obra
            </Btn>
          </div>
        </Card>
      ) : null}

      <div className="space-y-3">
        {artworks.rows.map((row, i) => (
          <ArtEditor
            key={row.id}
            row={row}
            index={i}
            first={i === 0}
            last={i === artworks.rows.length - 1}
            open={openId === row.id}
            onToggle={() => setOpenId(openId === row.id ? null : row.id)}
            onMove={(delta) => void artworks.move(row.id, delta)}
            onPatch={async (patch) => {
              const res = await artworks.patch(row.id, patch);
              if (res.ok) status.say("Obra salva.");
              else status.fail(res.error ?? "Falha ao salvar.");
              return res.ok;
            }}
            onDelete={async () => {
              const res = await artworks.remove(row.id);
              if (res.ok) status.say("Obra removida do site.");
              else status.fail(res.error ?? "Falha ao remover.");
            }}
          />
        ))}
        {!artworks.loading && artworks.rows.length === 0 ? (
          <p className="text-[13px] text-cream/45">Nenhuma obra cadastrada.</p>
        ) : null}
      </div>
    </div>
  );
}

function ArtEditor({
  row,
  index,
  first,
  last,
  open,
  onToggle,
  onMove,
  onPatch,
  onDelete,
}: {
  row: ArtRow;
  index: number;
  first: boolean;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  onMove: (delta: number) => void;
  onPatch: (patch: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    title: row.title,
    medium: row.medium,
    year: row.year,
    description: row.description,
    aspect: row.aspect,
    span: row.span,
    shift: row.shift,
    featured: row.featured === 1,
    imagePath: row.image_path,
  });
  const [tags, setTags] = useState<string[]>(parseTags(row.tags));

  useEffect(() => {
    setForm({
      title: row.title,
      medium: row.medium,
      year: row.year,
      description: row.description,
      aspect: row.aspect,
      span: row.span,
      shift: row.shift,
      featured: row.featured === 1,
      imagePath: row.image_path,
    });
    setTags(parseTags(row.tags));
  }, [row]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="overflow-hidden rounded-xl border border-cream/12 bg-cream/[0.03]">
      <div className="flex items-center gap-3 p-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-cream/15 bg-[#f7f2e6]">
          {row.image_path ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={row.image_path} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[10px] text-cream/30">sem img</span>
          )}
        </div>
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-cream">{row.title}</span>
            <span className="block truncate text-[11px] text-cream/45">
              {row.medium} · {row.year} · {row.aspect} · coluna {row.span}/12
              {row.featured === 1 ? " · destaque" : ""}
            </span>
          </span>
          <ChevronDown size={15} className={cn("text-cream/40 transition-transform", open && "rotate-180")} />
        </button>
        <span className="hidden w-7 text-center text-[11px] tabular-nums text-cream/35 sm:block">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Btn size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={first} title="Subir">
          <ArrowUp size={12} />
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onMove(1)} disabled={last} title="Descer">
          <ArrowDown size={12} />
        </Btn>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-cream/10 p-4">
          <ImagePicker
            value={form.imagePath}
            folder="site"
            onChange={(path) => set("imagePath", path)}
            hint="Envie um arquivo novo ou escolha algo da biblioteca de imagens do site."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Título">
              <Text value={form.title} onChange={(v) => set("title", v)} />
            </Field>
            <Field label="Técnica">
              <Text value={form.medium} onChange={(v) => set("medium", v)} />
            </Field>
            <Field label="Ano">
              <Text value={form.year} onChange={(v) => set("year", v)} />
            </Field>
          </div>

          <Field label="Descrição">
            <Area value={form.description} onChange={(v) => set("description", v)} rows={3} />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Proporção da moldura">
              <Pick value={form.aspect} onChange={(v) => set("aspect", v)} options={ASPECTS} />
            </Field>
            <Field label="Largura no grid (colunas de 12)">
              <Num value={form.span} onChange={(v) => set("span", v ?? 6)} min={3} max={12} />
            </Field>
            <Field label="Deslocamento vertical" hint="em quartos de rem; negativo sobe.">
              <Num value={form.shift} onChange={(v) => set("shift", v ?? 0)} min={-60} max={60} />
            </Field>
          </div>

          <Field label="Etiquetas" hint="Aparecem nos filtros internos; uma por linha.">
            <Lines value={tags} onChange={setTags} placeholder="aquarela" />
          </Field>

          <Check2
            checked={form.featured}
            onChange={(v) => set("featured", v)}
            label="Obra em destaque"
            hint="Marca a peça como principal do portfólio."
          />

          <div className="flex flex-wrap justify-between gap-2">
            <Btn variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={12} /> Excluir obra
            </Btn>
            <Btn
              variant="gold"
              size="sm"
              onClick={async () => {
                const ok = await onPatch({
                  title: form.title,
                  medium: form.medium,
                  year: form.year,
                  description: form.description,
                  aspect: form.aspect,
                  span: form.span,
                  shift: form.shift,
                  featured: form.featured,
                  imagePath: form.imagePath,
                  tags,
                });
                if (ok) onToggle();
              }}
            >
              <Save size={12} /> Salvar obra
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}
