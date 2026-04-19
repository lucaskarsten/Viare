"use client";
import { useState } from "react";
import CourseMap, { CourseMapModule } from "./CourseMap";

type Props = {
  modules: CourseMapModule[];
  slug: string;
  lessonListContent: React.ReactNode;
};

export default function CourseDetailTabs({ modules, slug, lessonListContent }: Props) {
  const [tab, setTab] = useState<"outline" | "map">("outline");
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab("outline")}
          className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            tab === "outline"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Conteúdo
        </button>
        <button
          onClick={() => setTab("map")}
          className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            tab === "map"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Mapa
        </button>
      </div>
      {tab === "outline" ? lessonListContent : <CourseMap modules={modules} slug={slug} />}
    </div>
  );
}
