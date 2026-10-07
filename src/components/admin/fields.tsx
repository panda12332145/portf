"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ==================================================================
 *  Peças de formulário e utilidades do painel administrativo
 * ================================================================== */

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? `Erro ${res.status}` };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Sem conexão com o servidor." };
  }
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? `Erro ${res.status}` };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Sem conexão com o servidor." };
  }
}

/* ------------------------------ layout ---------------------------- */

export function Card({
  title,
  hint,
  children,
  actions,
  className,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-cream/12 bg-cream/[0.03] p-5 backdrop-blur-sm sm:p-6",
        className,
      )}
    >
      {title || actions ? (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="font-display text-xl font-medium tracking-tight text-cream">{title}</h2>
            ) : null}
            {hint ? <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-cream/55">{hint}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  disabled,
  type = "button",
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost" | "outline" | "danger" | "gold";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase tracking-[0.14em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "px-3 py-1.5 text-[10px]" : "px-4 py-2.5 text-[11px]",
        variant === "solid" && "bg-strong text-on-strong hover:opacity-90",
        variant === "gold" && "bg-sun-400 text-ink hover:bg-sun-300",
        variant === "outline" && "border border-cream/25 text-cream hover:border-cream/60 hover:bg-cream/5",
        variant === "ghost" && "text-cream/60 hover:bg-cream/10 hover:text-cream",
        variant === "danger" && "border border-red-400/40 text-red-300 hover:bg-red-500/15",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-cream/50">
          {label}
        </span>
      ) : null}
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] leading-relaxed text-cream/40">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-cream/15 bg-soil-900/60 px-3 py-2.5 text-[13px] text-cream outline-none transition placeholder:text-cream/25 focus:border-sun-400/70 focus:ring-1 focus:ring-sun-400/30";

export function Text({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputCls, className)}
    />
  );
}

export function Area({
  value,
  onChange,
  rows = 4,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputCls, "resize-y leading-relaxed", className)}
    />
  );
}

export function Num({
  value,
  onChange,
  step = 1,
  min,
  max,
  className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={cn(inputCls, "tabular-nums", className)}
    />
  );
}

export function Pick({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-soil-900 text-cream">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Check2({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex w-full items-start gap-3 rounded-lg border border-cream/12 bg-soil-900/40 px-3.5 py-3 text-left transition-colors hover:border-cream/25"
    >
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
          checked ? "border-sun-400 bg-sun-400" : "border-cream/30",
        )}
      >
        {checked ? <Check size={12} strokeWidth={3.5} className="text-ink" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-cream">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] leading-relaxed text-cream/45">{hint}</span> : null}
      </span>
    </button>
  );
}

/** Lista de linhas de texto (versos, itens da FAQ…). */
export function Lines({
  value,
  onChange,
  placeholder,
  addLabel = "Adicionar linha",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const update = (i: number, v: string) => onChange(value.map((line, idx) => (idx === i ? v : line)));

  return (
    <div className="space-y-2">
      {value.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <Text value={line} onChange={(v) => update(i, v)} placeholder={placeholder} />
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            title="Remover linha"
          >
            <X size={14} />
          </Btn>
        </div>
      ))}
      <Btn variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
        <Plus size={12} /> {addLabel}
      </Btn>
    </div>
  );
}

/* --------------------------- imagem ------------------------------- */

export interface LibraryItem {
  path: string;
  name: string;
  folder: "site" | "book";
  width: number | null;
  height: number | null;
}

export function ImagePicker({
  value,
  onChange,
  folder,
  hint,
  allowEmpty = true,
}: {
  value: string;
  onChange: (path: string, size?: { width: number | null; height: number | null }) => void;
  folder: "site" | "book";
  hint?: string;
  allowEmpty?: boolean;
}) {
  const [library, setLibrary] = useState<LibraryItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadLibrary = useCallback(async () => {
    const res = await apiGet<{ library: LibraryItem[] }>("/api/admin/upload");
    if (res.ok && res.data) setLibrary(res.data.library);
  }, []);

  useEffect(() => {
    if (open && !library) void loadLibrary();
  }, [open, library, loadLibrary]);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        image?: { path: string; width: number | null; height: number | null };
      };
      if (!res.ok || !data.image) {
        setError(data.error ?? "Falha no envio.");
        return;
      }
      onChange(data.image.path, { width: data.image.width, height: data.image.height });
      setLibrary(null);
    } catch {
      setError("Sem conexão com o servidor.");
    } finally {
      setBusy(false);
    }
  };

  const options = useMemo(() => (library ?? []).filter((i) => i.folder === folder), [library, folder]);

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-cream/15 bg-[#f7f2e6]">
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="grid h-full w-full place-items-center text-cream/25">
              <ImagePlus size={18} />
            </span>
          )}
        </div>

        <div className="min-w-[220px] flex-1 space-y-2">
          <Text value={value} onChange={(v) => onChange(v)} placeholder="/images/minha-arte.jpg" />
          <div className="flex flex-wrap items-center gap-2">
            <Btn size="sm" variant="gold" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {busy ? "Enviando…" : "Enviar imagem"}
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
              Escolher do acervo
            </Btn>
            {allowEmpty && value ? (
              <Btn size="sm" variant="ghost" onClick={() => onChange("")}>
                <Trash2 size={12} /> Limpar
              </Btn>
            ) : null}
          </div>
          <p className="text-[11px] leading-relaxed text-cream/40">
            {hint ??
              (folder === "book"
                ? "Vai para a galeria de imagens do livro."
                : "Vai para a biblioteca de imagens do site.")}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />

      {error ? <p className="mt-2 text-[11px] text-red-300">{error}</p> : null}

      {open ? (
        <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-cream/15 bg-soil-900/60 p-2">
          {library === null ? (
            <p className="p-3 text-[12px] text-cream/50">Carregando…</p>
          ) : options.length === 0 ? (
            <p className="p-3 text-[12px] text-cream/50">Nenhuma imagem nesta pasta ainda.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {options.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    onChange(item.path, { width: item.width, height: item.height });
                    setOpen(false);
                  }}
                  className={cn(
                    "overflow-hidden rounded-md border text-left transition",
                    value === item.path ? "border-sun-400" : "border-cream/15 hover:border-cream/40",
                  )}
                  title={item.path}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.path} alt="" className="h-20 w-full bg-[#f7f2e6] object-contain" />
                  <span className="block truncate px-1.5 py-1 text-[10px] text-cream/60">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------- mensagens ----------------------------- */

export function Status({ error, ok }: { error?: string | null; ok?: string | null }) {
  if (!error && !ok) return null;
  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-[12px]",
        error ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-leaf-500/40 bg-leaf-500/10 text-cream/85",
      )}
    >
      {error ?? ok}
    </p>
  );
}

export function useStatus() {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((message: string) => {
    setError(null);
    setOk(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOk(null), 4000);
  }, []);

  const fail = useCallback((message: string) => {
    setOk(null);
    setError(message);
  }, []);

  const clear = useCallback(() => {
    setOk(null);
    setError(null);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return { error, ok, say, fail, clear };
}

/* ------------------------ lista de recursos ----------------------- */

export interface Row {
  id: number;
  ord?: number;
  slug?: string;
}

/** CRUD sobre /api/admin/resources/<nome>. */
export function useResource<T extends Row>(resource: string, initial: T[] = []) {
  const [rows, setRows] = useState<T[]>(initial);
  const [loading, setLoading] = useState(initial.length === 0);

  const load = useCallback(async () => {
    const res = await apiGet<{ rows: T[] }>(`/api/admin/resources/${resource}`);
    if (res.ok && res.data) {
      setRows(res.data.rows);
      setLoading(false);
      return res.data.rows;
    }
    setLoading(false);
    return null;
  }, [resource]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await apiSend<{ id: number }>(`/api/admin/resources/${resource}`, "POST", body);
      if (res.ok) await load();
      return res;
    },
    [resource, load],
  );

  const patch = useCallback(
    async (id: number, body: Record<string, unknown>) => {
      const res = await apiSend(`/api/admin/resources/${resource}/${id}`, "PATCH", body);
      if (res.ok) await load();
      return res;
    },
    [resource, load],
  );

  const remove = useCallback(
    async (id: number) => {
      const res = await apiSend(`/api/admin/resources/${resource}/${id}`, "DELETE");
      if (res.ok) await load();
      return res;
    },
    [resource, load],
  );

  const move = useCallback(
    async (id: number, delta: number) => {
      const index = rows.findIndex((r) => r.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= rows.length) return { ok: true };
      const next = [...rows];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      setRows(next);
      return apiSend(`/api/admin/resources/${resource}`, "PUT", { order: next.map((r) => r.id) });
    },
    [rows, resource],
  );

  return { rows, setRows, loading, load, create, patch, remove, move };
}
