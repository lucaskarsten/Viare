"use client";

import { useTranslations } from "next-intl";

export default function MobileTopBar() {
  const t = useTranslations("sidebar");

  function openSidebar() {
    document.dispatchEvent(new CustomEvent("open-sidebar"));
  }

  function openSearch() {
    document.dispatchEvent(new CustomEvent("open-search"));
  }

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur border-b border-border">
      <button
        type="button"
        onClick={openSidebar}
        aria-label={t("openMenu")}
        className="-ml-2 grid place-items-center w-10 h-10 rounded border-0 bg-transparent text-foreground cursor-pointer hover:bg-muted"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-accent flex" aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </span>
        <span className="text-base font-semibold leading-none tracking-tight text-foreground">
          Viare
        </span>
      </div>
      <button
        type="button"
        onClick={openSearch}
        aria-label={t("search")}
        className="grid place-items-center w-10 h-10 rounded border-0 bg-transparent text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground"
      >
        <span className="text-[18px] leading-none">⌕</span>
      </button>
    </header>
  );
}
