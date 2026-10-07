import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteIcon } from "@/components/site/Icon";

/** Página inexistente — mesmo visual do site, sem detalhes técnicos. */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-soil-900 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,203,61,0.14),transparent_55%)]" />

      <div className="relative">
        <SiteIcon name="Flower2" size={22} className="mx-auto text-sun-400" />
        <p className="mt-8 text-[13px] font-semibold text-sun-300">404</p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-cream sm:text-5xl">
          Esta página não existe
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-cream/60">
          O endereço que você abriu não foi encontrado — talvez tenha mudado de lugar. O resto do
          ateliê continua no ar.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-sun-400 px-5 py-3 text-[13px] font-semibold text-ink transition hover:bg-sun-300"
          >
            <ArrowLeft size={13} /> Voltar ao início
          </Link>
          <Link
            href="/galeria"
            className="inline-flex items-center gap-2 rounded-md border border-cream/25 px-5 py-3 text-[13px] font-medium text-cream transition hover:border-cream/60"
          >
            Ver a galeria
          </Link>
        </div>
      </div>
    </main>
  );
}
