"use client";

import dynamic from "next/dynamic";
import { BookOpen } from "lucide-react";

const BookExperience = dynamic(() => import("./BookExperience"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#120d07]">
      <BookOpen className="mb-5 h-9 w-9 animate-pulse text-sun-400" strokeWidth={1.2} />
      <p className="font-book text-xl italic text-cream/80">Preparando o livro…</p>
    </div>
  ),
});

export default function BookExperienceLoader(props: {
  book: React.ComponentProps<typeof BookExperience>["book"];
  pages: React.ComponentProps<typeof BookExperience>["pages"];
}) {
  return <BookExperience {...props} />;
}
