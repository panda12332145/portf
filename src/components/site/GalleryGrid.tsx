"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Artwork } from "@/lib/types";
import { ArtLightbox, type LightboxItem } from "./ArtLightbox";

const SPAN: Record<number, string> = {
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};

export default function GalleryGrid({
  artworks,
  columns = "12",
}: {
  artworks: Artwork[];
  columns?: "12" | "auto";
}) {
  const [index, setIndex] = useState<number | null>(null);

  const items: LightboxItem[] = artworks.map((a) => ({
    slug: a.slug,
    image: a.image,
    title: a.title,
    type: a.medium,
    description: a.description,
    meta: `${a.medium} · ${a.year}`,
  }));

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 gap-x-8 gap-y-14",
          columns === "12" ? "md:grid-cols-12" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {artworks.map((art, i) => (
          <motion.figure
            key={art.slug}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className={cn("group", columns === "12" && SPAN[art.span], columns === "12" && "art-shift")}
            style={
              columns === "12"
                ? ({ "--art-shift": `${art.shift * 0.25}rem` } as CSSProperties)
                : undefined
            }
          >
            <button
              onClick={() => setIndex(i)}
              className="block w-full cursor-zoom-in overflow-hidden rounded-lg border border-cream/15 text-left"
              style={{ aspectRatio: art.aspect.replace("/", " / ") }}
              aria-label={`Ampliar ${art.title}`}
            >
              <span className="relative block h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={art.image}
                  alt={art.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <span className="pointer-events-none absolute right-3 top-3 grid h-8 w-8 translate-y-1 place-items-center rounded-full border border-cream/25 bg-black/45 text-cream/85 opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <Maximize2 size={13} />
                </span>
              </span>
            </button>

            <figcaption className="mt-3 flex items-baseline justify-between gap-4 border-t border-cream/15 pt-3">
              <div>
                <h3 className="text-sm font-semibold text-cream">{art.title}</h3>
                <p className="mt-0.5 text-xs text-cream/55">
                  {art.medium} · {art.year}
                </p>
              </div>
              <span className="text-xs tabular-nums text-cream/40">
                {String(i + 1).padStart(2, "0")}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <ArtLightbox
        items={items}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setIndex(null)}
      />
    </>
  );
}
