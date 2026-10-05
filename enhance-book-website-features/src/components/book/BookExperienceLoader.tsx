"use client";

import dynamic from "next/dynamic";
import { BookOpen } from "lucide-react";

const BookExperience = dynamic(() => import("./BookExperience"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#e8ddc6]">
      <BookOpen className="mb-6 h-10 w-10 text-[#a8843e]" strokeWidth={1.2} />
      <p className="font-display text-2xl italic text-[#5c4c33]">Preparando o livro…</p>
    </div>
  ),
});

export default function BookExperienceLoader() {
  return <BookExperience />;
}
