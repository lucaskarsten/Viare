"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type Props = {
  children: ReactNode;
};

export default function SidebarSheet({ children }: Props) {
  const t = useTranslations("sidebar");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-sidebar", handler);
    return () => document.removeEventListener("open-sidebar", handler);
  }, []);

  function handleContentClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a")) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="w-[86vw] max-w-[320px] p-0 bg-card border-r border-border overflow-y-auto"
        onClick={handleContentClick}
      >
        <SheetTitle className="sr-only">{t("tagline")}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
