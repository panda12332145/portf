"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

/* ==================================================================
 *  Tema claro / escuro / sistema
 * ------------------------------------------------------------------
 *  A escolha fica em localStorage ("atelier-tema"), ou seja, no
 *  próprio navegador — para sempre. Sem escolha, seguimos o sistema
 *  (`prefers-color-scheme`), que também é o padrão de fábrica.
 *  O script em src/components/site/ThemeScript.tsx aplica o tema
 *  antes da primeira pintura, então não há piscada.
 * ================================================================== */

export type ThemeMode = "system" | "light" | "dark";

export const THEME_KEY = "atelier-tema";

export const THEME_LABELS: Record<ThemeMode, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Escuro",
};

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(mode);
  root.dataset.themeMode = mode;
  if (mode === "system") root.style.removeProperty("color-scheme");
  else root.style.colorScheme = mode;
  window.dispatchEvent(new CustomEvent("atelier:theme", { detail: mode }));
}

/** Mantém o tema aplicado (inclusive quando o sistema muda). */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readTheme();
    setMode(stored);
    applyTheme(stored);
    setReady(true);

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (readTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", onSystem);
    return () => media.removeEventListener("change", onSystem);
  }, []);

  const change = useCallback((next: ThemeMode) => {
    setMode(next);
    if (next === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }, []);

  return { mode, change, ready };
}

/* ------------------------------- UI ------------------------------- */

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

export function ThemeToggle({
  compact = false,
  className,
}: {
  /** compact = só ícones (cabeçalho do site) · expandido = com rótulos (painel) */
  compact?: boolean;
  className?: string;
}) {
  const { mode, change, ready } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-cream/20 bg-cream/5 p-0.5 backdrop-blur",
        className,
      )}
      role="group"
      aria-label="Tema da página"
    >
      {(Object.keys(THEME_LABELS) as ThemeMode[]).map((option) => {
        const Icon = ICONS[option];
        const active = ready && mode === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => change(option)}
            aria-pressed={active}
            title={`${THEME_LABELS[option]}${option === "system" ? " (padrão)" : ""}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full transition-colors duration-200",
              compact ? "h-7 w-7 justify-center" : "px-3 py-1.5 text-[12px] font-medium",
              active
                ? "bg-sun-400 text-ink"
                : "text-cream/60 hover:bg-cream/10 hover:text-cream",
            )}
          >
            <Icon size={compact ? 13 : 12} strokeWidth={2.2} />
            {compact ? null : THEME_LABELS[option]}
          </button>
        );
      })}
      <span className="sr-only">
        Tema atual: {THEME_LABELS[mode]}
        {mode === "system" ? " (seguindo o sistema)" : ""}
      </span>
    </div>
  );
}

export default ThemeToggle;
