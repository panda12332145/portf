import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { brl, commissionTypes } from "../data";
import { cn } from "../utils/cn";
import { useScrollTo } from "../lib/scroll";

export default function Commission() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useScrollTo();

  const total = useMemo(
    () =>
      commissionTypes
        .filter((t) => selected.includes(t.id))
        .reduce((acc, t) => acc + t.price, 0),
    [selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const onBoxScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 12);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    if (!name.trim()) errs.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0 || selected.length === 0) return;
    setSubmitted(true);
  };

  const reset = () => {
    setName("");
    setEmail("");
    setDesc("");
    setSelected([]);
    setErrors({});
    setSubmitted(false);
  };

  const labelCls =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a6233]";
  const fieldCls = (invalid: boolean) =>
    cn(
      "w-full rounded-md border bg-white px-4 py-3 text-sm text-[#2b1d0b] outline-none transition placeholder:text-[#b3a283]",
      "focus:border-ink/70 focus:ring-1 focus:ring-ink/25",
      invalid ? "border-red-400 ring-1 ring-red-300/50" : "border-[#d9cca6]",
    );

  return (
    <section id="comissoes" className="relative px-5 pb-32 pt-24 md:px-12 md:pt-36">
      <div className="mx-auto max-w-4xl">
        {/* cabeçalho */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sun-300">
              03 — Comissões
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-cream md:text-5xl">
              Encomende a sua arte
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-cream/65">
            Escolha um ou mais estilos, descreva a ideia e envie. Respondemos
            por e-mail com orçamento e prazo.{" "}
            <span className="text-cream/85">3 vagas restantes para abril.</span>
          </p>
        </motion.header>

        {/* cartão do formulário */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 rounded-xl border border-[#e6dcc0] bg-[#fdf8ec]/95 shadow-[0_30px_80px_-30px_rgba(15,8,0,0.7)] backdrop-blur-xl"
        >
          <AnimatePresence mode="wait" initial={false}>
            {submitted ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center px-6 py-20 text-center md:px-10"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-ink/15 bg-ink text-sun-300">
                  <Check size={26} strokeWidth={2.5} />
                </span>
                <h3 className="mt-6 font-display text-3xl font-medium tracking-tight text-[#2b1d0b]">
                  Pedido enviado, {name.split(" ")[0]}.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[#7a6a4d]">
                  Recebemos seu pedido com {selected.length}{" "}
                  {selected.length > 1 ? "estilos" : "estilo"} ({brl(total)}{" "}
                  estimados). Você terá retorno em até 48h úteis no e-mail{" "}
                  <span className="font-semibold text-[#2b1d0b]">{email}</span>.
                </p>
                <button
                  onClick={reset}
                  className="mt-8 inline-flex items-center gap-2 rounded-md border border-[#c9b98d] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5c4a2e] transition-colors hover:border-ink hover:text-[#2b1d0b]"
                >
                  <RotateCcw size={13} />
                  Nova comissão
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit}
                noValidate
                className="p-6 md:p-10"
              >
                {/* dados */}
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className={labelCls}>Nome</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como podemos te chamar?"
                      className={fieldCls(!!errors.name)}
                    />
                    {errors.name && (
                      <span className="mt-1 block text-[11px] text-red-500">
                        Informe seu nome.
                      </span>
                    )}
                  </label>
                  <label className="block">
                    <span className={labelCls}>E-mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seunome@email.com"
                      className={fieldCls(!!errors.email)}
                    />
                    {errors.email && (
                      <span className="mt-1 block text-[11px] text-red-500">
                        Informe um e-mail válido.
                      </span>
                    )}
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className={labelCls}>Descrição da ideia</span>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    placeholder="Conte sobre a cena, os personagens, referências, cores e prazo desejado."
                    className={cn(fieldCls(false), "resize-none leading-relaxed")}
                  />
                </label>

                {/* retângulo de estilos com scroll próprio */}
                <div className="mt-9">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <span className={cn(labelCls, "mb-0")}>
                      Estilos de arte — selecione quantos quiser
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] tabular-nums text-[#9a8560]">
                        {selected.length} de {commissionTypes.length}{" "}
                        selecionados
                      </span>
                      <AnimatePresence>
                        {selected.length > 0 && (
                          <motion.button
                            type="button"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            onClick={() => setSelected([])}
                            className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a6233] underline decoration-[#c9b98d] underline-offset-4 transition-colors hover:text-red-500"
                          >
                            Limpar
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="relative rounded-lg border border-[#d9cca6] bg-white/50">
                    <div
                      ref={boxRef}
                      onScroll={onBoxScroll}
                      className="styles-scroll max-h-[360px] overflow-y-auto p-2.5 md:p-3"
                    >
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {commissionTypes.map((t) => {
                          const active = selected.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggle(t.id)}
                              aria-pressed={active}
                              className={cn(
                                "flex items-center justify-between gap-3 rounded-md border px-3.5 py-3 text-left transition-colors duration-200",
                                active
                                  ? "border-ink bg-ink"
                                  : "border-[#e2d5b3] bg-white hover:border-ink/50",
                              )}
                            >
                              <span className="min-w-0">
                                <span
                                  className={cn(
                                    "block truncate text-[13px] font-semibold leading-snug",
                                    active ? "text-cream" : "text-[#2b1d0b]",
                                  )}
                                >
                                  {t.name}
                                </span>
                                <span
                                  className={cn(
                                    "mt-0.5 block text-[11px] font-medium tabular-nums",
                                    active ? "text-sun-300" : "text-[#9a7d42]",
                                  )}
                                >
                                  {brl(t.price)}
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-200",
                                  active
                                    ? "border-sun-400 bg-sun-400"
                                    : "border-[#c9b98d] bg-transparent",
                                )}
                              >
                                {active && (
                                  <Check size={11} strokeWidth={3.5} className="text-ink" />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* indicador de que há mais conteúdo abaixo */}
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center rounded-b-lg bg-gradient-to-t from-[#efe6cd] to-transparent pb-1.5 transition-opacity duration-300",
                        atBottom ? "opacity-0" : "opacity-100",
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a744c]">
                        role para ver todos
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed text-[#9a8560]">
                    Não trabalhamos com gore, conteúdo NSFW ou cópia do estilo
                    de outros artistas —{" "}
                    <button
                      type="button"
                      onClick={() => scrollTo("#faq")}
                      className="font-semibold text-[#7a6233] underline decoration-[#c9b98d] underline-offset-4 transition-colors hover:text-ink"
                    >
                      veja o FAQ
                    </button>
                    .
                  </p>
                </div>

                {/* rodapé do cartão */}
                <div className="mt-9 flex flex-col gap-5 border-t border-[#e0d3ae] pt-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-baseline gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a6233]">
                      Estimativa
                    </span>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={total}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          "font-display text-3xl font-medium tabular-nums tracking-tight md:text-4xl",
                          total > 0 ? "text-[#2b1d0b]" : "text-[#c3b392]",
                        )}
                      >
                        {brl(total)}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[10px] leading-tight text-[#9a8560]">
                      valor final combinado
                      <br />
                      por e-mail
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={selected.length === 0}
                    className={cn(
                      "group flex w-full items-center justify-between gap-6 rounded-md py-3.5 pl-6 pr-4 text-[12px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 md:w-auto md:min-w-[240px]",
                      selected.length === 0
                        ? "cursor-not-allowed bg-[#ddd0b6] text-[#9c8a68]"
                        : "bg-ink text-cream hover:bg-black",
                    )}
                  >
                    Enviar pedido
                    <ArrowRight
                      size={15}
                      className={cn(
                        "transition-transform duration-300",
                        selected.length > 0 && "group-hover:translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {selected.length === 0 && (
                  <p className="mt-2 text-right text-[11px] italic text-[#a08c68]">
                    Selecione ao menos um estilo para enviar.
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
