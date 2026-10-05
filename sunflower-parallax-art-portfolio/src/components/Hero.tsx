import { motion } from "framer-motion";
import { ArrowDown, ChevronDown } from "lucide-react";
import { useScrollTo } from "../lib/scroll";

const stats = ["desde 2019", "120+ obras entregues", "resposta em até 48h"];

const container = {
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Hero() {
  const { scrollTo } = useScrollTo();

  return (
    <section id="sobre" className="relative min-h-[100svh] px-5 md:px-12">
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="mx-auto grid min-h-[100svh] w-full max-w-6xl items-end gap-12 pb-24 pt-32 lg:grid-cols-[1fr_auto]"
      >
        <div className="max-w-2xl">
          <motion.p
            variants={item}
            className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sun-200"
          >
            Atelier Girassol — estúdio de ilustração
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-4xl font-medium leading-[1.12] tracking-tight text-cream md:text-6xl"
          >
            Um estúdio de ilustração feita{" "}
            <em className="italic text-sun-300">à mão</em>, sem pressa e sem
            atalhos.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 text-base leading-relaxed text-cream/85 md:text-lg"
          >
            O Atelier Girassol é um estúdio independente fundado em 2019, no
            interior de Minas. Transformamos ideias em imagens — retratos,
            capas de livro, personagens, pôsteres — trabalhando com aquarela,
            guache e pintura digital.
          </motion.p>

          <motion.p
            variants={item}
            className="mt-4 max-w-xl text-sm leading-relaxed text-cream/60"
          >
            Cada comissão é desenhada do zero: sem arte gerada, sem inteligência
            artificial. Só referência, pincel e café.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <button
              onClick={() => scrollTo("#comissoes")}
              className="rounded-md bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-cream transition-colors duration-300 hover:bg-black"
            >
              Pedir uma comissão
            </button>
            <button
              onClick={() => scrollTo("#portfolio")}
              className="group flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-cream/80 transition-colors hover:text-cream"
            >
              <span className="border-b border-cream/30 pb-0.5 transition-colors group-hover:border-cream">
                Ver portfólio
              </span>
              <ArrowDown size={13} />
            </button>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-cream/15 pt-6"
          >
            {stats.map((s) => (
              <span
                key={s}
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/55"
              >
                {s}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.figure variants={item} className="hidden max-w-xs md:block lg:w-80 xl:w-96">
          <img
            src="/images/artist.jpg"
            alt="Ilustradora pintando ao ar livre entre girassóis"
            className="aspect-[3/4] w-full rounded-lg border border-cream/20 object-cover"
          />
          <figcaption className="mt-2 text-[11px] text-cream/55">
            Helena, estudo no campo — 2025
          </figcaption>
        </motion.figure>
      </motion.div>

      <motion.button
        onClick={() => scrollTo("#portfolio")}
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-cream/50 transition-colors hover:text-cream md:flex"
        aria-label="Rolar para o portfólio"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.32em]">
          role
        </span>
        <ChevronDown size={14} />
      </motion.button>
    </section>
  );
}
