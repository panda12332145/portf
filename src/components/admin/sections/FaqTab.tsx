"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import { Area, Btn, Card, Field, Lines, Status, Text, useResource, useStatus, type Row } from "../fields";
import { cn } from "@/lib/cn";

/* ==================================================================
 *  FAQ — adicionar, editar, reordenar e excluir perguntas
 * ================================================================== */

interface FaqRow extends Row {
  question: string;
  answer: string;
  items: string | null;
  footnote: string | null;
}

const parseItems = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
};

export default function FaqTab() {
  const status = useStatus();
  const faqs = useResource<FaqRow>("faqs");
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ question: "", answer: "" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream">
            Perguntas frequentes
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
            A ordem aqui é a ordem na página. Cada pergunta aceita uma resposta, uma lista de itens
            (as “coisas que o estúdio não faz”) e uma observação final em itálico.
          </p>
        </div>
        <Btn variant="gold" onClick={() => setCreating((c) => !c)}>
          <Plus size={13} /> Nova pergunta
        </Btn>
      </div>

      <Status error={status.error} ok={status.ok} />

      {creating ? (
        <Card title="Nova pergunta">
          <div className="grid gap-4">
            <Field label="Pergunta">
              <Text value={draft.question} onChange={(v) => setDraft((d) => ({ ...d, question: v }))} />
            </Field>
            <Field label="Resposta">
              <Area value={draft.answer} onChange={(v) => setDraft((d) => ({ ...d, answer: v }))} rows={4} />
            </Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setCreating(false)}>
                Cancelar
              </Btn>
              <Btn
                variant="gold"
                onClick={async () => {
                  const res = await faqs.create({ question: draft.question, answer: draft.answer, items: [] });
                  if (res.ok) {
                    setDraft({ question: "", answer: "" });
                    setCreating(false);
                    status.say("Pergunta criada.");
                  } else status.fail(res.error ?? "Falha ao criar.");
                }}
              >
                <Save size={13} /> Criar pergunta
              </Btn>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="space-y-3">
        {faqs.rows.map((row, i) => (
          <FaqEditor
            key={row.id}
            row={row}
            index={i}
            first={i === 0}
            last={i === faqs.rows.length - 1}
            open={openId === row.id}
            onToggle={() => setOpenId(openId === row.id ? null : row.id)}
            onMove={(delta) => void faqs.move(row.id, delta)}
            onSave={async (patch) => {
              const res = await faqs.patch(row.id, patch);
              if (res.ok) status.say("Pergunta salva.");
              else status.fail(res.error ?? "Falha ao salvar.");
              return res.ok;
            }}
            onDelete={async () => {
              const res = await faqs.remove(row.id);
              if (res.ok) status.say("Pergunta removida.");
              else status.fail(res.error ?? "Falha ao remover.");
            }}
          />
        ))}
        {!faqs.loading && faqs.rows.length === 0 ? (
          <p className="text-[13px] text-cream/45">Nenhuma pergunta cadastrada.</p>
        ) : null}
      </div>
    </div>
  );
}

function FaqEditor({
  row,
  index,
  first,
  last,
  open,
  onToggle,
  onMove,
  onSave,
  onDelete,
}: {
  row: FaqRow;
  index: number;
  first: boolean;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  onMove: (delta: number) => void;
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => void | Promise<void>;
}) {
  const [question, setQuestion] = useState(row.question);
  const [answer, setAnswer] = useState(row.answer);
  const [items, setItems] = useState<string[]>(parseItems(row.items));
  const [footnote, setFootnote] = useState(row.footnote ?? "");

  useEffect(() => {
    setQuestion(row.question);
    setAnswer(row.answer);
    setItems(parseItems(row.items));
    setFootnote(row.footnote ?? "");
  }, [row]);

  return (
    <div className="overflow-hidden rounded-xl border border-cream/12 bg-cream/[0.03]">
      <div className="flex items-center gap-2 p-3">
        <span className="w-7 text-center text-[11px] tabular-nums text-cream/35">
          {String(index + 1).padStart(2, "0")}
        </span>
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <span className="flex-1 truncate text-[13px] font-semibold text-cream">{question || "(sem pergunta)"}</span>
          <ChevronDown size={15} className={cn("text-cream/40 transition-transform", open && "rotate-180")} />
        </button>
        <Btn size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={first} title="Subir">
          <ArrowUp size={12} />
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onMove(1)} disabled={last} title="Descer">
          <ArrowDown size={12} />
        </Btn>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-cream/10 p-4">
          <Field label="Pergunta">
            <Text value={question} onChange={setQuestion} />
          </Field>
          <Field label="Resposta">
            <Area value={answer} onChange={setAnswer} rows={5} />
          </Field>
          <Field label="Lista de itens" hint="Opcional — aparece com um ✕ na frente de cada linha.">
            <Lines value={items} onChange={setItems} placeholder="ex.: Conteúdo NSFW" />
          </Field>
          <Field label="Observação final" hint="Opcional — sai em itálico.">
            <Area value={footnote} onChange={setFootnote} rows={2} />
          </Field>

          <div className="flex flex-wrap justify-between gap-2">
            <Btn variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={12} /> Excluir pergunta
            </Btn>
            <Btn
              variant="gold"
              size="sm"
              onClick={async () => {
                const ok = await onSave({
                  question,
                  answer,
                  items,
                  footnote: footnote.trim() === "" ? null : footnote,
                });
                if (ok) onToggle();
              }}
            >
              <Save size={12} /> Salvar pergunta
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}
