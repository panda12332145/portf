"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
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
  apiGet,
  apiSend,
  useResource,
  useStatus,
  type Row,
} from "../fields";
import { cn } from "@/lib/cn";

/* ==================================================================
 *  Livro: ficha, capa e as páginas do miolo (a pasta public/book/)
 * ================================================================== */

interface PageRow extends Row {
  book_id: number;
  slug: string;
  kind: string;
  title: string;
  type: string;
  description: string;
  poem: string | null;
  image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  folio: number | null;
  fit: string;
  frame: string;
  backdrop: string;
  mount_tone: string;
  zoom: number;
  offset_x: number;
  offset_y: number;
  rotation: number;
  radius: number;
  plate_pad: number;
  shadow: number;
  layout_auto: number;
}

interface BookRow {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  edition: string;
  description: string;
  dedication: string;
  spine_label: string;
  cover_image: string;
  cover_art_title: string;
  cover_layout: string | null;
}

const parseList = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
};

const KINDS = [
  { value: "title", label: "Folha de rosto" },
  { value: "art", label: "Ilustração" },
  { value: "interlude", label: "Interlúdio (só texto)" },
  { value: "finale", label: "Página final" },
];

const FITS = [
  { value: "contain", label: "Caber inteira (contain)" },
  { value: "cover", label: "Preencher cortando (cover)" },
];
const FRAMES = [
  { value: "plate", label: "Moldura (plate)" },
  { value: "bleed", label: "Sangrando na página (bleed)" },
  { value: "none", label: "Sem moldura" },
];
const BACKDROPS = [
  { value: "none", label: "Nenhum" },
  { value: "blur", label: "Desfoque da própria arte" },
  { value: "tint", label: "Tinta da moldura" },
  { value: "paper", label: "Papel" },
];
const TONES = [
  { value: "paper", label: "Papel" },
  { value: "ink", label: "Tinta" },
];

export default function BookTab() {
  const status = useStatus();
  const pages = useResource<PageRow>("pages");
  const [book, setBook] = useState<BookRow | null>(null);
  const [draft, setDraft] = useState<BookRow | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void apiGet<{ book: BookRow }>("/api/admin/book").then((res) => {
      if (!res.ok || !res.data) return status.fail(res.error ?? "Falha ao carregar a ficha do livro.");
      setBook(res.data.book);
      setDraft(res.data.book);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof BookRow>(key: K, value: BookRow[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const dirty = book && draft ? JSON.stringify(book) !== JSON.stringify(draft) : false;

  const saveBook = async (patch?: Record<string, unknown>) => {
    if (!draft) return;
    const body = patch ?? {
      title: draft.title,
      subtitle: draft.subtitle,
      author: draft.author,
      publisher: draft.publisher,
      edition: draft.edition,
      description: draft.description,
      dedication: draft.dedication,
      spineLabel: draft.spine_label,
      coverImage: draft.cover_image,
      coverArtTitle: draft.cover_art_title,
      coverLayout: draft.cover_layout,
    };
    const res = await apiSend<{ book: BookRow }>("/api/admin/book", "PATCH", body);
    if (!res.ok || !res.data) return status.fail(res.error ?? "Falha ao salvar a ficha.");
    setBook(res.data.book);
    setDraft(res.data.book);
    status.say("Ficha do livro salva — o site já mostra o novo conteúdo.");
  };

  if (!draft) {
    return (
      <Card title="Livro">
        <p className="text-[13px] text-cream/50">Carregando…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream">Livro ilustrado</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
            A ficha do livro, a capa e cada página do miolo. As imagens vivem em{" "}
            <code className="text-cream/75">public/book/</code> — a pasta exclusiva do livro.
          </p>
        </div>
        <Link
          href="/estudio"
          className="inline-flex items-center gap-2 rounded-md border border-cream/25 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cream transition hover:border-cream/60"
        >
          Abrir no estúdio visual <ExternalLink size={13} />
        </Link>
      </div>

      <Status error={status.error} ok={status.ok} />

      <Card title="Ficha e capa">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Título">
            <Text value={draft.title} onChange={(v) => set("title", v)} />
          </Field>
          <Field label="Subtítulo">
            <Text value={draft.subtitle} onChange={(v) => set("subtitle", v)} />
          </Field>
          <Field label="Autoria">
            <Text value={draft.author} onChange={(v) => set("author", v)} />
          </Field>
          <Field label="Editora / selo">
            <Text value={draft.publisher} onChange={(v) => set("publisher", v)} />
          </Field>
          <Field label="Edição">
            <Text value={draft.edition} onChange={(v) => set("edition", v)} />
          </Field>
          <Field label="Texto da lombada">
            <Text value={draft.spine_label} onChange={(v) => set("spine_label", v)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Sinopse" hint="Aparece no cabeçalho da seção do livro, na página inicial.">
              <Area value={draft.description} onChange={(v) => set("description", v)} rows={4} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Dedicatória" hint="Sai na folha de guarda, antes do miolo.">
              <Area value={draft.dedication} onChange={(v) => set("dedication", v)} rows={2} />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Arte da capa">
              <ImagePicker
                value={draft.cover_image}
                folder="book"
                onChange={(path) => set("cover_image", path)}
                hint="Enviada para public/book/. O título da arte aparece na capa interna."
              />
            </Field>
          </div>
          <Field label="Título da arte da capa">
            <Text value={draft.cover_art_title} onChange={(v) => set("cover_art_title", v)} />
          </Field>
          <Field label="Enquadramento da capa" hint="JSON técnico; use o botão para recalcular.">
            <Text value={draft.cover_layout ?? ""} onChange={(v) => set("cover_layout", v)} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-cream/10 pt-5">
          <Btn
            variant="outline"
            onClick={() => void saveBook({ coverLayout: "auto", coverImage: draft.cover_image })}
          >
            <RefreshCw size={13} /> Recalcular capa
          </Btn>
          <Btn variant="gold" onClick={() => void saveBook()} disabled={!dirty}>
            <Save size={13} /> Salvar ficha
          </Btn>
        </div>
      </Card>

      <Card
        title="Páginas do miolo"
        hint="A ordem aqui é a ordem de leitura (frente e verso de cada folha). O enquadramento fino também pode ser ajustado no estúdio visual."
        actions={
          <Btn variant="gold" size="sm" onClick={() => setCreating((c) => !c)}>
            <Plus size={12} /> Nova página
          </Btn>
        }
      >
        {creating ? (
          <div className="mb-4 rounded-lg border border-cream/12 bg-soil-900/40 p-4">
            <CreatePage
              onCreate={async (body) => {
                const res = await pages.create(body);
                if (res.ok) {
                  setCreating(false);
                  status.say("Página criada — envie a arte e ajuste o enquadramento.");
                } else status.fail(res.error ?? "Falha ao criar a página.");
              }}
              onCancel={() => setCreating(false)}
            />
          </div>
        ) : null}

        <div className="space-y-3">
          {pages.rows.map((row, i) => (
            <PageEditor
              key={row.id}
              row={row}
              index={i}
              first={i === 0}
              last={i === pages.rows.length - 1}
              open={openId === row.id}
              onToggle={() => setOpenId(openId === row.id ? null : row.id)}
              onMove={(delta) => void pages.move(row.id, delta)}
              onPatch={async (patch) => {
                const res = await pages.patch(row.id, patch);
                if (res.ok) status.say("Página salva.");
                else status.fail(res.error ?? "Falha ao salvar.");
                return res.ok;
              }}
              onDelete={async () => {
                const res = await pages.remove(row.id);
                if (res.ok) status.say("Página removida do livro.");
                else status.fail(res.error ?? "Falha ao remover.");
              }}
            />
          ))}
          {!pages.loading && pages.rows.length === 0 ? (
            <p className="text-[13px] text-cream/45">Nenhuma página cadastrada.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function CreatePage({
  onCreate,
  onCancel,
}: {
  onCreate: (body: Record<string, unknown>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ title: "", type: "", kind: "art", description: "", imagePath: "" });
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Título">
          <Text value={form.title} onChange={(v) => set("title", v)} />
        </Field>
        <Field label="Tipo / técnica">
          <Text value={form.type} onChange={(v) => set("type", v)} placeholder="Aquarela sobre papel" />
        </Field>
        <Field label="Tipo de página">
          <Pick value={form.kind} onChange={(v) => set("kind", v)} options={KINDS} />
        </Field>
      </div>
      <Field label="Descrição">
        <Area value={form.description} onChange={(v) => set("description", v)} rows={2} />
      </Field>
      <ImagePicker value={form.imagePath} folder="book" onChange={(path) => set("imagePath", path)} />
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>
          Cancelar
        </Btn>
        <Btn variant="gold" onClick={() => void onCreate({ ...form, poem: [], shadow: true, layoutAuto: true })}>
          <Save size={13} /> Criar página
        </Btn>
      </div>
    </div>
  );
}

function PageEditor({
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
  row: PageRow;
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
    type: row.type,
    kind: row.kind,
    description: row.description,
    folio: row.folio,
    imagePath: row.image_path ?? "",
    fit: row.fit,
    frame: row.frame,
    backdrop: row.backdrop,
    mountTone: row.mount_tone,
    zoom: row.zoom,
    offsetX: row.offset_x,
    offsetY: row.offset_y,
    rotation: row.rotation,
    radius: row.radius,
    platePad: row.plate_pad,
    shadow: row.shadow === 1,
    layoutAuto: row.layout_auto === 1,
  });
  const [poem, setPoem] = useState<string[]>(parseList(row.poem));

  useEffect(() => {
    setForm({
      title: row.title,
      type: row.type,
      kind: row.kind,
      description: row.description,
      folio: row.folio,
      imagePath: row.image_path ?? "",
      fit: row.fit,
      frame: row.frame,
      backdrop: row.backdrop,
      mountTone: row.mount_tone,
      zoom: row.zoom,
      offsetX: row.offset_x,
      offsetY: row.offset_y,
      rotation: row.rotation,
      radius: row.radius,
      platePad: row.plate_pad,
      shadow: row.shadow === 1,
      layoutAuto: row.layout_auto === 1,
    });
    setPoem(parseList(row.poem));
  }, [row]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="overflow-hidden rounded-xl border border-cream/12 bg-cream/[0.03]">
      <div className="flex items-center gap-3 p-3">
        <div className="h-14 w-11 shrink-0 overflow-hidden rounded border border-cream/15 bg-[#f7f2e6]">
          {row.image_path ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={row.image_path} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[9px] text-cream/30">texto</span>
          )}
        </div>
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-cream">{row.title}</span>
            <span className="block truncate text-[11px] text-cream/45">
              {row.slug} · {row.kind} · {row.type}
              {row.folio ? ` · folio ${row.folio}` : ""} ·{" "}
              {row.layout_auto === 1 ? "enquadramento automático" : "ajustado à mão"}
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
            folder="book"
            onChange={(path) => set("imagePath", path)}
            hint="Páginas sem arte (folha de rosto, interlúdio) podem ficar sem imagem."
          />

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Título" className="md:col-span-2">
              <Text value={form.title} onChange={(v) => set("title", v)} />
            </Field>
            <Field label="Tipo / técnica">
              <Text value={form.type} onChange={(v) => set("type", v)} />
            </Field>
            <Field label="Tipo de página">
              <Pick value={form.kind} onChange={(v) => set("kind", v)} options={KINDS} />
            </Field>
          </div>

          <Field label="Descrição">
            <Area value={form.description} onChange={(v) => set("description", v)} rows={3} />
          </Field>

          <Field label="Versos" hint="Cada linha é um verso, exibido na página.">
            <Lines value={poem} onChange={setPoem} placeholder="Toda hora começa numa mão" />
          </Field>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Folio" hint="Número impresso no pé da página.">
              <Num value={form.folio} onChange={(v) => set("folio", v)} min={0} max={999} />
            </Field>
            <Field label="Ajuste">
              <Pick
                value={form.fit}
                onChange={(v) => set("fit", v)}
                options={FITS}
              />
            </Field>
            <Field label="Moldura">
              <Pick value={form.frame} onChange={(v) => set("frame", v)} options={FRAMES} />
            </Field>
            <Field label="Fundo">
              <Pick value={form.backdrop} onChange={(v) => set("backdrop", v)} options={BACKDROPS} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Tom do passe-partout">
              <Pick value={form.mountTone} onChange={(v) => set("mountTone", v)} options={TONES} />
            </Field>
            <Field label="Zoom">
              <Num value={form.zoom} step={0.01} min={0.4} max={2.5} onChange={(v) => set("zoom", v ?? 1)} />
            </Field>
            <Field label="Deslocar X (%)">
              <Num value={form.offsetX} step={0.5} min={-45} max={45} onChange={(v) => set("offsetX", v ?? 0)} />
            </Field>
            <Field label="Deslocar Y (%)">
              <Num value={form.offsetY} step={0.5} min={-45} max={45} onChange={(v) => set("offsetY", v ?? 0)} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Rotação (graus)">
              <Num value={form.rotation} step={0.1} min={-18} max={18} onChange={(v) => set("rotation", v ?? 0)} />
            </Field>
            <Field label="Cantos (raio)">
              <Num value={form.radius} step={1} min={0} max={90} onChange={(v) => set("radius", v ?? 8)} />
            </Field>
            <Field label="Margem da moldura">
              <Num value={form.platePad} step={1} min={0} max={120} onChange={(v) => set("platePad", v ?? 26)} />
            </Field>
            <div className="space-y-2">
              <Check2 checked={form.shadow} onChange={(v) => set("shadow", v)} label="Sombra na arte" />
            </div>
          </div>

          <Check2
            checked={form.layoutAuto}
            onChange={(v) => set("layoutAuto", v)}
            label="Enquadramento automático"
            hint="Ligado: o ateliê calcula o enquadramento pela proporção da imagem. Desligado: valem os números acima."
          />

          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              <Btn variant="danger" size="sm" onClick={onDelete}>
                <Trash2 size={12} /> Excluir página
              </Btn>
              <Btn
                variant="outline"
                size="sm"
                onClick={async () => {
                  const ok = await onPatch({
                    imagePath: form.imagePath,
                    layoutAuto: true,
                    recompute: true,
                  });
                  if (ok) set("layoutAuto", true);
                }}
              >
                <RefreshCw size={12} /> Recalcular enquadramento
              </Btn>
            </div>
            <Btn
              variant="gold"
              size="sm"
              onClick={async () => {
                const ok = await onPatch({
                  title: form.title,
                  type: form.type,
                  kind: form.kind,
                  description: form.description,
                  poem,
                  folio: form.folio,
                  imagePath: form.imagePath,
                  fit: form.fit,
                  frame: form.frame,
                  backdrop: form.backdrop,
                  mountTone: form.mountTone,
                  zoom: form.zoom,
                  offsetX: form.offsetX,
                  offsetY: form.offsetY,
                  rotation: form.rotation,
                  radius: form.radius,
                  platePad: form.platePad,
                  shadow: form.shadow,
                  layoutAuto: form.layoutAuto,
                });
                if (ok) onToggle();
              }}
            >
              <Save size={12} /> Salvar página
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}
