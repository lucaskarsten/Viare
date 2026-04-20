"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/actions/locale";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: "pt" | "en") {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex gap-0.5 bg-muted p-0.5 rounded">
      <button
        type="button"
        onClick={() => handleChange("en")}
        className={`font-mono text-[11px] px-2.5 py-1 rounded-[3px] tracking-[0.04em] border-0 cursor-pointer transition-colors ${
          locale === "en" ? "bg-background text-foreground" : "text-muted-foreground"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleChange("pt")}
        className={`font-mono text-[11px] px-2.5 py-1 rounded-[3px] tracking-[0.04em] border-0 cursor-pointer transition-colors ${
          locale === "pt" ? "bg-background text-foreground" : "text-muted-foreground"
        }`}
        aria-pressed={locale === "pt"}
      >
        PT
      </button>
    </div>
  );
}
