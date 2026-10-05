"use client";

import { motion, useScroll, useTransform } from "framer-motion";

interface ButterflyCfg {
  id: number;
  x: number;
  y: number;
  size: number;
  dur: number;
  flap: number;
  colors: [string, string];
  hideMobile?: boolean;
}

const BUTTERFLIES: ButterflyCfg[] = [
  { id: 1, x: 7, y: 24, size: 36, dur: 27, flap: 0.46, colors: ["#ffe082", "#f59e0b"] },
  { id: 2, x: 79, y: 15, size: 28, dur: 32, flap: 0.4, colors: ["#fda4af", "#e11d48"] },
  { id: 3, x: 32, y: 11, size: 24, dur: 35, flap: 0.44, colors: ["#ddd6fe", "#8b5cf6"], hideMobile: true },
  { id: 4, x: 63, y: 31, size: 42, dur: 24, flap: 0.52, colors: ["#fdba74", "#ea580c"] },
  { id: 5, x: 88, y: 44, size: 26, dur: 30, flap: 0.42, colors: ["#fff7ed", "#f59e0b"], hideMobile: true },
  { id: 6, x: 14, y: 52, size: 22, dur: 34, flap: 0.38, colors: ["#f9a8d4", "#db2777"] },
];

function Butterfly({ cfg }: { cfg: ButterflyCfg }) {
  const { x, y, size, dur, flap, colors } = cfg;
  const gId = `wing-${cfg.id}`;
  return (
    <motion.div
      className={`absolute ${cfg.hideMobile ? "hidden md:block" : ""}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ x: [0, 90, -60, 120, -30, 0], y: [0, -70, 30, -110, -20, 0], rotate: [0, 10, -8, 14, -4, 0] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 80"
        fill="none"
        style={{ filter: "drop-shadow(0 6px 10px rgba(20,10,0,0.35))" }}
      >
        <defs>
          <linearGradient id={gId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors[0]} />
            <stop offset="1" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <g className="wing-l" style={{ animationDuration: `${flap}s` }}>
          <path d="M48 38c-22-32-52-26-45 2-8 16 15 24 45 10 2-4 2-8 0-12Z" fill={`url(#${gId})`} opacity="0.95" />
        </g>
        <g className="wing-r" style={{ animationDuration: `${flap}s` }}>
          <path d="M52 38c22-32 52-26 45 2 8 16-15 24-45 10-2-4-2-8 0-12Z" fill={`url(#${gId})`} opacity="0.95" />
        </g>
        <path d="M50 24c2.5 8 2.5 20 0 30" stroke="#3a2a12" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M47 22c-3-5-6-8-9-9m13 9c3-5 6-8 9-9" stroke="#3a2a12" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

/** Borboletas voando sobre a página — somem conforme o scroll avança. */
export default function Butterflies() {
  const { scrollYProgress } = useScroll();
  const fade = useTransform(scrollYProgress, [0.4, 0.62], [1, 0]);
  const drift = useTransform(scrollYProgress, [0, 1], ["0vh", "-14vh"]);

  return (
    <motion.div
      style={{ opacity: fade, y: drift }}
      className="pointer-events-none fixed inset-0 z-30"
      aria-hidden="true"
    >
      {BUTTERFLIES.map((b) => (
        <Butterfly key={b.id} cfg={b} />
      ))}
    </motion.div>
  );
}
