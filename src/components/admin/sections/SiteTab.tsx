"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  Area,
  Btn,
  Card,
  Field,
  ImagePicker,
  Lines,
  Pick,
  Status,
  Text,
  apiGet,
  apiSend,
  useStatus,
} from "../fields";
import { SITE_ICON_NAMES, SiteIcon } from "@/components/site/Icon";

/* ==================================================================
 *  Textos e imagens do site
 *  Cada campo aqui é uma chave de site_meta (editável também por SQL).
 * ================================================================== */

type FieldType = "text" | "area" | "image" | "icon" | "lines";

interface SpecField {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  folder?: "site" | "book";
}

interface Group {
  title: string;
  hint?: string;
  fields: SpecField[];
}

const GROUPS: Group[] = [
  {
    title: "Identidade do estúdio",
    fields: [
      { key: "name", label: "Nome do estúdio", type: "text" },
      { key: "tagline", label: "Assinatura curta", type: "text" },
      { key: "email", label: "E-mail de contato", type: "text" },
      { key: "location", label: "Localização", type: "text" },
      { key: "since", label: "Desde (ano)", type: "text" },
      { key: "siteIcon", label: "Ícone da marca", type: "icon" },
    ],
  },
  {
    title: "Topo do site (hero)",
    hint: "No título você pode destacar uma palavra entre *asteriscos* — ela fica em itálico dourado.",
    fields: [
      { key: "heroEyebrow", label: "Linha de cima", type: "text" },
      { key: "heroTitle", label: "Título grande", type: "area" },
      { key: "heroLede", label: "Parágrafo de apresentação", type: "area" },
      { key: "heroNote", label: "Observação (arte feita à mão…)", type: "area" },
      { key: "heroImage", label: "Imagem do topo", type: "image", folder: "site" },
      { key: "heroCaption", label: "Legenda da imagem", type: "text" },
      { key: "backgroundImage", label: "Imagem de fundo do site", type: "image", folder: "site" },
      { key: "stats", label: "Números/etiquetas do topo", type: "lines", hint: "uma por linha" },
      { key: "heroCtaPrimary", label: "Botão principal", type: "text" },
      { key: "heroCtaSecondary", label: "Botão “abrir o livro”", type: "text" },
      { key: "heroCtaTertiary", label: "Botão “ver portfólio”", type: "text" },
    ],
  },
  {
    title: "Menu do topo",
    fields: [
      { key: "navAboutLabel", label: "Link 1 (sobre)", type: "text" },
      { key: "navBookLabel", label: "Link 2 (livro)", type: "text" },
      { key: "navPortfolioLabel", label: "Link 3 (portfólio)", type: "text" },
      { key: "navFaqLabel", label: "Link 4 (FAQ)", type: "text" },
      { key: "navCtaLabel", label: "Botão do menu", type: "text" },
    ],
  },
  {
    title: "Seções da página inicial",
    hint: "O título da seção do livro vem da ficha do livro (aba Livro).",
    fields: [
      { key: "bookSectionEyebrow", label: "Livro — numeração/etiqueta", type: "text" },
      { key: "bookSectionFootnote", label: "Livro — nota de rodapé", type: "area" },
      { key: "gallerySectionEyebrow", label: "Portfólio — numeração/etiqueta", type: "text" },
      { key: "gallerySectionTitle", label: "Portfólio — título", type: "text" },
      { key: "gallerySectionLede", label: "Portfólio — descrição", type: "area" },
      { key: "faqSectionEyebrow", label: "FAQ — numeração/etiqueta", type: "text" },
      { key: "faqSectionTitle", label: "FAQ — título", type: "text" },
      { key: "faqSectionLede", label: "FAQ — descrição", type: "area" },
      { key: "commissionSectionEyebrow", label: "Comissões — numeração/etiqueta", type: "text" },
      { key: "commissionSectionTitle", label: "Comissões — título", type: "text" },
      { key: "commissionSectionLede", label: "Comissões — descrição", type: "area" },
      { key: "commissionNote", label: "Comissões — etiqueta de vagas", type: "text", hint: "ex.: 3 vagas restantes para abril." },
    ],
  },
  {
    title: "Formulário de comissão",
    fields: [
      { key: "commissionFormName", label: "Rótulo do nome", type: "text" },
      { key: "commissionFormNamePlaceholder", label: "Dica do nome", type: "text" },
      { key: "commissionFormEmail", label: "Rótulo do e-mail", type: "text" },
      { key: "commissionFormEmailPlaceholder", label: "Dica do e-mail", type: "text" },
      { key: "commissionFormIdea", label: "Rótulo da descrição", type: "text" },
      { key: "commissionFormIdeaPlaceholder", label: "Dica da descrição", type: "area" },
      { key: "commissionFormStyles", label: "Título da lista de estilos", type: "text" },
      { key: "commissionFormSubmit", label: "Texto do botão enviar", type: "text" },
      { key: "commissionFormEstimate", label: "Rótulo da estimativa", type: "text" },
      { key: "commissionFormFootnote", label: "Aviso abaixo da lista", type: "area" },
      { key: "commissionFormSuccess", label: "Título ao enviar", type: "text", hint: "use {nome} para o primeiro nome de quem escreveu" },
      { key: "commissionFormSuccessNote", label: "Mensagem ao enviar", type: "area" },
    ],
  },
  {
    title: "Página da galeria (/galeria)",
    hint: "Na descrição valem os marcadores {obras}, {paginas} e {livro}.",
    fields: [
      { key: "galleryPageEyebrow", label: "Etiqueta do topo", type: "text" },
      { key: "galleryPageTitle", label: "Título da página", type: "text" },
      { key: "galleryPageLede", label: "Descrição", type: "area" },
      { key: "galleryWorksTitle", label: "Título da lista de obras", type: "text" },
      { key: "galleryPlatesTitle", label: "Título da lista de páginas do livro", type: "text" },
      { key: "galleryPlatesNote", label: "Nota das páginas do livro", type: "area" },
      { key: "galleryFooterNote", label: "Nota do rodapé da galeria", type: "text" },
    ],
  },
  {
    title: "Rodapé",
    fields: [
      { key: "footerGalleryLabel", label: "Link galeria", type: "text" },
      { key: "footerStudioLabel", label: "Link estúdio", type: "text" },
      { key: "footerAdminLabel", label: "Link admin", type: "text" },
      { key: "footerTopLabel", label: "Link voltar ao topo", type: "text" },
      { key: "footerNote", label: "Nota do rodapé", type: "text" },
    ],
  },
  {
    title: "Título da aba do navegador",
    fields: [
      { key: "metaTitle", label: "Título", type: "text" },
      { key: "metaDescription", label: "Descrição", type: "area" },
      { key: "metaOgTitle", label: "Título ao compartilhar", type: "text" },
      { key: "metaOgDescription", label: "Descrição ao compartilhar", type: "area" },
    ],
  },
];

const SPEC_KEYS = new Set(GROUPS.flatMap((g) => g.fields.map((f) => f.key)));

export default function SiteTab() {
  const status = useStatus();
  const [meta, setMeta] = useState<Record<string, string> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiGet<{ meta: { key: string; value: string }[] }>("/api/admin/site-meta").then((res) => {
      if (!res.ok || !res.data) return status.fail(res.error ?? "Falha ao carregar os textos.");
      const map: Record<string, string> = {};
      for (const row of res.data.meta) map[row.key] = row.value;
      setMeta(map);
      setDraft(map);
      setExtra(Object.entries(map).filter(([k]) => !SPEC_KEYS.has(k)).map(([key, value]) => ({ key, value })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changed = useMemo(() => {
    if (!meta) return [] as string[];
    return Object.keys(draft).filter((k) => draft[k] !== meta[k]);
  }, [draft, meta]);

  const set = (key: string, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    if (!changed.length) return;
    setSaving(true);
    const patch: Record<string, string> = {};
    for (const key of changed) patch[key] = draft[key];
    // chaves extras (linhas em branco viram remoção)
    const res = await apiSend<{ changed: number }>("/api/admin/site-meta", "PATCH", { patch });
    setSaving(false);
    if (!res.ok) return status.fail(res.error ?? "Não foi possível salvar.");
    setMeta(draft);
    status.say(`${res.data?.changed ?? changed.length} campo(s) salvos. Já estão no ar.`);
  };

  const reset = () => meta && setDraft(meta);

  const saveExtras = async () => {
    const patch: Record<string, string> = {};
    for (const item of extra) if (item.key.trim()) patch[item.key.trim()] = item.value;
    const res = await apiSend("/api/admin/site-meta", "PATCH", { patch });
    if (res.ok) status.say("Chaves extras salvas.");
    else status.fail(res.error ?? "Falha ao salvar.");
    void apiGet<{ meta: { key: string; value: string }[] }>("/api/admin/site-meta").then((r) => {
      if (r.ok && r.data) setMeta(Object.fromEntries(r.data.meta.map((m) => [m.key, m.value])));
    });
  };

  const removeKey = async (key: string) => {
    const res = await apiSend(`/api/admin/site-meta?key=${encodeURIComponent(key)}`, "DELETE");
    if (res.ok) {
      setExtra((list) => list.filter((i) => i.key !== key));
      status.say(`Chave “${key}” removida.`);
    } else status.fail(res.error ?? "Falha ao remover.");
  };

  if (!meta) {
    return (
      <Card title="Textos e imagens">
        <p className="text-[13px] text-cream/50">Carregando…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream">
            Textos, imagens e ícones
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
            Edite os textos e escolha as imagens de cada parte do site. Ao salvar, as mudanças
            aparecem na hora para quem visita — sem precisar recarregar nada aqui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" onClick={reset} disabled={!changed.length}>
            <RotateCcw size={13} /> Descartar
          </Btn>
          <Btn variant="gold" onClick={save} disabled={!changed.length || saving}>
            <Save size={13} /> {saving ? "Salvando…" : `Salvar${changed.length ? ` (${changed.length})` : ""}`}
          </Btn>
        </div>
      </div>

      <Status error={status.error} ok={status.ok} />

      {GROUPS.map((group) => (
        <Card key={group.title} title={group.title} hint={group.hint}>
          <div className="grid gap-5 md:grid-cols-2">
            {group.fields.map((field) => {
              const value = draft[field.key] ?? "";
              const wide = field.type === "area" || field.type === "image" || field.type === "lines";
              return (
                <div key={field.key} className={wide ? "md:col-span-2" : undefined}>
                  <Field label={field.label} hint={field.hint}>
                    {field.type === "text" ? (
                      <Text value={value} onChange={(v) => set(field.key, v)} />
                    ) : null}
                    {field.type === "area" ? (
                      <Area value={value} onChange={(v) => set(field.key, v)} rows={3} />
                    ) : null}
                    {field.type === "image" ? (
                      <ImagePicker
                        value={value}
                        folder={field.folder ?? "site"}
                        onChange={(path) => set(field.key, path)}
                      />
                    ) : null}
                    {field.type === "lines" ? (
                      <Lines
                        value={parseLines(value)}
                        onChange={(lines) => set(field.key, JSON.stringify(lines))}
                        placeholder="ex.: 120+ obras entregues"
                      />
                    ) : null}
                    {field.type === "icon" ? (
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cream/15 bg-soil-900/60 text-sun-300">
                          <SiteIcon name={value} size={19} />
                        </span>
                        <Pick
                          value={value}
                          onChange={(v) => set(field.key, v)}
                          options={SITE_ICON_NAMES.map((n) => ({ value: n, label: n }))}
                          className="max-w-xs"
                        />
                      </div>
                    ) : null}
                  </Field>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card
        title="Outras chaves"
        hint="Campos avançados de conteúdo, além dos de cima. Crie, edite ou remova — útil para personalizações pontuais."
        actions={
          <div className="flex gap-2">
            <Btn size="sm" variant="outline" onClick={() => setExtra((l) => [...l, { key: "", value: "" }])}>
              <Plus size={12} /> Nova chave
            </Btn>
            <Btn size="sm" variant="gold" onClick={saveExtras}>
              <Save size={12} /> Salvar chaves
            </Btn>
          </div>
        }
      >
        {extra.length === 0 ? (
          <p className="text-[12px] text-cream/45">Nenhuma chave extra.</p>
        ) : (
          <div className="space-y-2">
            {extra.map((item, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Text
                  value={item.key}
                  onChange={(v) =>
                    setExtra((l) => l.map((it, idx) => (idx === i ? { ...it, key: v } : it)))
                  }
                  placeholder="chave"
                  className="max-w-[220px]"
                />
                <Text
                  value={item.value}
                  onChange={(v) =>
                    setExtra((l) => l.map((it, idx) => (idx === i ? { ...it, value: v } : it)))
                  }
                  placeholder="valor"
                  className="flex-1"
                />
                <Btn
                  size="sm"
                  variant="ghost"
                  title="Remover"
                  onClick={() =>
                    item.key ? void removeKey(item.key) : setExtra((l) => l.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 size={13} />
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function parseLines(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v));
  } catch {
    /* texto simples → uma linha por quebra */
  }
  return raw.split("\n").filter((l) => l.trim() !== "");
}
