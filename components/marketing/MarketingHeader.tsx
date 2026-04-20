import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "./Wordmark";

export async function MarketingHeader() {
  const t = await getTranslations("landing.header");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" aria-label="Viare" className="flex items-center">
          <Wordmark className="h-5" />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/courses"
            className="hidden sm:inline-flex items-center h-8 px-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("catalog")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-8 px-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-8 px-3.5 text-[13px] font-medium rounded-lg bg-foreground text-background hover:opacity-85 transition-opacity"
          >
            {t("getStarted")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
