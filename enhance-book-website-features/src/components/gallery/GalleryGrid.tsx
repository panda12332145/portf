"use client";

import { useState } from "react";
import { ArtLightbox } from "@/components/ArtLightbox";
import type { ArtData } from "@/lib/book-data";
import { ImageOff } from "lucide-react";

export function GalleryGrid({ arts }: { arts: ArtData[] }) {
  const [active, setActive] = useState<ArtData | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {arts.map((art) => (
          <button
            key={art.slug}
            onClick={() => setActive(art)}
            className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[#3a3126]/10 bg-[#efe3c6] text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            {art.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={art.image}
                alt={art.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#8a744a]/50">
                <ImageOff className="h-8 w-8" strokeWidth={1.2} />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#e3c789]">
                {art.isCover ? "Capa" : art.folio ? `Página ${art.folio}` : art.finale ? "Final" : ""}
              </span>
              <span className="font-serif text-sm font-semibold leading-tight text-white sm:text-base">
                {art.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      <ArtLightbox art={active} onClose={() => setActive(null)} />
    </>
  );
}
