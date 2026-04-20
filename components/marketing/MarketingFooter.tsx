import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Wordmark } from "./Wordmark";

export async function MarketingFooter() {
  const t = await getTranslations("landing.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Wordmark className="h-5" />
          <p className="text-[13px] text-muted-foreground max-w-xs leading-relaxed">
            {t("tagline")}
          </p>
        </div>

        <div className="space-y-3">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
            {t("product")}
          </div>
          <ul className="flex flex-col gap-2 text-[13px]">
            <li>
              <Link
                href="/courses"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("catalog")}
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("login")}
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("signup")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
            {t("legal")}
          </div>
          <ul className="flex flex-col gap-2 text-[13px]">
            <li>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("privacy")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
            {t("language")}
          </div>
          <LocaleSwitcher />
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-5 font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
          {t("copyright", { year })}
        </div>
      </div>
    </footer>
  );
}
