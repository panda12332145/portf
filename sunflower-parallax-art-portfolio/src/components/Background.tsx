import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";

/**
 * Fundo fixo do site:
 *  - o campo de girassóis se move devagar (parallax)
 *  - quanto mais a página desce, mais embaçado e escuro ele fica
 */
export default function Background() {
  const { scrollYProgress } = useScroll();

  const blur = useTransform(scrollYProgress, [0, 0.45, 1], [0, 5, 15]);
  const filter = useMotionTemplate`blur(${blur}px) saturate(1.06)`;

  // parallax: o campo desliza mais devagar que o conteúdo
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "6%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1.24]);

  // o sol (brilho) se move mais rápido = camada mais próxima
  const sunY = useTransform(scrollYProgress, [0, 1], ["0%", "55%"]);
  const sunOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  // véu escuro que cresce conforme o scroll → legibilidade do formulário
  const shade = useTransform(scrollYProgress, [0.12, 0.7], [0, 0.58]);

  return (
    <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* camada do campo */}
      <motion.div style={{ filter, y, scale }} className="absolute inset-0">
        <img
          src="/images/field.jpg"
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      </motion.div>

      {/* sol / glow dourado */}
      <motion.div
        style={{ y: sunY, opacity: sunOpacity }}
        className="absolute -top-40 right-[8%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,214,120,0.75),rgba(255,190,60,0.25)_45%,transparent_70%)] mix-blend-screen"
      />

      {/* véus permanentes de leitura */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-soil-900/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[42vh] bg-gradient-to-t from-soil-900/55 via-soil-900/10 to-transparent" />

      {/* véu escuro progressivo */}
      <motion.div style={{ opacity: shade }} className="absolute inset-0 bg-soil-900" />
    </div>
  );
}
