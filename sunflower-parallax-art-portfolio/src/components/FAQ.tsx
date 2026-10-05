import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "../utils/cn";

interface FaqItem {
  q: string;
  a: string;
  notDoList?: string[];
  after?: string;
}

const faqs: FaqItem[] = [
  {
    q: "Como funciona uma comissão do início ao fim?",
    a: "Você preenche o formulário escolhendo um ou mais estilos e descrevendo a ideia. Em até 48h úteis respondemos por e-mail com orçamento fechado e prazo. Com a aprovação, pedimos um sinal de 50% para reservar a vaga, enviamos um sketch para aprovação, produzimos a arte final e entregamos os arquivos prontos.",
  },
  {
    q: "Qual é o prazo médio de entrega?",
    a: "Estilos rápidos como sketch, chibi e ícone: de 5 a 10 dias úteis. Ilustrações completas: de 10 a 20 dias úteis. Capas de livro e projetos maiores: até 30 dias úteis. O prazo exato é sempre confirmado junto com o orçamento.",
  },
  {
    q: "Quais são as formas de pagamento?",
    a: "Aceitamos Pix, transferência bancária e cartão de crédito via link de pagamento. O fluxo padrão é 50% de sinal e 50% na entrega da arte final. Em pedidos abaixo de R$ 150, pedimos o pagamento integral antecipado.",
  },
  {
    q: "Quantas revisões estão incluídas?",
    a: "Incluímos até 2 rodadas de revisão no sketch e 1 rodada de ajustes finos na arte final, sem custo. Mudanças estruturais pedidas após a aprovação do sketch podem ter custo adicional — sempre avisado antes de prosseguir.",
  },
  {
    q: "Que tipos de arte o estúdio não faz?",
    a: "Para manter o atelier seguro e honesto, não aceitamos pedidos com:",
    notDoList: [
      "Gore e violência gráfica explícita",
      "Conteúdo erótico ou NSFW",
      "Temas de ódio, discriminação ou assédio",
      "Cópia fiel do estilo de outro artista",
      "Material destinado a NFTs ou treinamento de IA",
    ],
    after: "Ficou em dúvida se a sua ideia se encaixa? Pergunte pelo formulário — respondemos sem compromisso.",
  },
  {
    q: "Posso usar a arte comercialmente?",
    a: "O valor base cobre uso pessoal: presentes, perfis e coleção própria. Para uso comercial — capas publicadas, produtos, campanhas — acrescentamos uma licença de 50% sobre o valor. Os direitos autorais permanecem com o estúdio; pedimos crédito sempre que a arte for publicada.",
  },
  {
    q: "Como recebo os arquivos?",
    a: "Você recebe um PNG em alta resolução (300 dpi), uma versão otimizada para redes sociais e, quando aplicável, o timelapse do processo. Arquivos editáveis podem ser combinados em projetos comerciais.",
  },
];

function FaqRow({
  item,
  index,
  open,
  onToggle,
}: {
  item: FaqItem;
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
          <span className="text-xs tabular-nums text-cream/35">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-base font-medium text-cream transition-colors group-hover:text-sun-200 md:text-lg">
            {item.q}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors",
            open
              ? "border-sun-300 bg-sun-400 text-ink"
              : "border-cream/20 text-cream/60 group-hover:border-cream/50",
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
              <p className="text-sm leading-relaxed text-cream/70">{item.a}</p>

              {item.notDoList && (
                <ul className="mt-4 space-y-2.5">
                  {item.notDoList.map((li) => (
                    <li
                      key={li}
                      className="flex items-start gap-2.5 text-sm text-cream/75"
                    >
                      <X size={14} className="mt-0.5 shrink-0 text-red-400/80" />
                      {li}
                    </li>
                  ))}
                </ul>
              )}

              {item.after && (
                <p className="mt-4 text-sm italic leading-relaxed text-cream/55">
                  {item.after}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(4);

  return (
    <section id="faq" className="relative px-5 pt-24 md:px-12 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sun-300">
              02 — Perguntas frequentes
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-cream md:text-5xl">
              Antes de comissionar
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-cream/65">
            Como funcionam as comissões, prazos, pagamento — e o que o estúdio
            não produz.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          {faqs.map((f, i) => (
            <FaqRow
              key={f.q}
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
