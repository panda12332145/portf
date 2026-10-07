"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { SiteIcon } from "@/components/site/Icon";

/** Erro inesperado — aviso amigável, sem expor detalhes internos. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-soil-900 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,203,61,0.14),transparent_55%)]" />

      <div className="relative">
        <SiteIcon name="Flower2" size={22} className="mx-auto text-sun-400" />
        <h1 className="mt-8 font-display text-4xl font-medium tracking-tight text-cream sm:text-5xl">
          Algo saiu do trilho
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-cream/60">
          Encontramos um problema inesperado ao abrir esta página. Tente de novo em alguns
          instantes — se persistir, o ateliê pode ser avisado pelo formulário de comissões.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-sun-400 px-5 py-3 text-[13px] font-semibold text-ink transition hover:bg-sun-300"
          >
            <RefreshCw size={13} /> Tentar de novo
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-cream/25 px-5 py-3 text-[13px] font-medium text-cream transition hover:border-cream/60"
          >
            <ArrowLeft size={13} /> Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
