"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Faq } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

function FaqRow({
  item,
  index,
  open,
  onToggle,
}: {
  item: Faq;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-cream/15 last:border-b">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="flex items-baseline gap-4">
          <span className="text-xs tabular-nums text-cream/35">{String(index + 1).padStart(2, "0")}</span>
          <span className="text-base font-medium text-cream transition-colors group-hover:text-sun-200 md:text-lg">
            {item.question}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors",
            open ? "border-sun-300 bg-sun-400 text-ink" : "border-cream/20 text-cream/60 group-hover:border-cream/50",
          )}
        >
          <Plus size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="max-w-2xl pb-7 pl-8 pr-4 md:pl-9">
              <p className="text-sm leading-relaxed text-cream/70">{item.answer}</p>

              {item.list.length > 0 && (
                <ul className="mt-4 space-y-2.5">
                  {item.list.map((li) => (
                    <li key={li} className="flex items-start gap-2.5 text-sm text-cream/75">
                      <X size={14} className="mt-0.5 shrink-0 text-red-400/80" />
                      {li}
                    </li>
                  ))}
                </ul>
              )}

              {item.footnote && (
                <p className="mt-4 text-sm italic leading-relaxed text-cream/55">{item.footnote}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ({
  faqs,
  eyebrow,
  title,
  lede,
}: {
  faqs: Faq[];
  eyebrow: string;
  title: string;
  lede: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(4);

  return (
    <section id="faq" className="relative px-5 pt-24 md:px-12 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeader eyebrow={eyebrow} title={title} lede={lede} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 max-w-4xl md:mt-16"
        >
          {faqs.map((f, i) => (
            <FaqRow
              key={f.question}
              item={f}
              index={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
