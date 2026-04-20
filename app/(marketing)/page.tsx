import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, GitFork, Share2, PenLine } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LibraryCards } from "@/components/marketing/illustrations/LibraryCards";
import { FlashcardMock } from "@/components/marketing/illustrations/FlashcardMock";
import { Heatmap } from "@/components/marketing/illustrations/Heatmap";
import { TopicCloud } from "@/components/marketing/illustrations/TopicCloud";
import { CategoryGrid } from "@/components/marketing/illustrations/CategoryGrid";
import { GenerateStream } from "@/components/marketing/illustrations/GenerateStream";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LandingPage() {
  const t = await getTranslations("landing");

  const features = [
    { key: "library", illustration: <LibraryCards /> },
    { key: "review", illustration: <FlashcardMock /> },
    { key: "goals", illustration: <Heatmap /> },
    { key: "discover", illustration: <TopicCloud /> },
    { key: "catalog", illustration: <CategoryGrid /> },
    { key: "generate", illustration: <GenerateStream /> },
  ] as const;

  const steps = ["step1", "step2", "step3"] as const;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground mb-8">
            {t("hero.eyebrow")}
          </div>
          <h1 className="font-medium tracking-[-0.03em] leading-[0.95] text-5xl sm:text-7xl md:text-[88px] max-w-4xl">
            {t("hero.titleA")}
            <br />
            <span className="text-muted-foreground">{t("hero.titleB")}</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            {t("hero.subhead")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-foreground text-background text-[14px] font-medium hover:opacity-85 transition-opacity"
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center h-11 px-5 rounded-lg border border-border bg-background text-[14px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-border/60 bg-muted/30">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground whitespace-nowrap">
              {t("trust.label")}
            </span>
            <span className="font-mono text-[12px] tracking-[0.02em] text-foreground/80">
              {t("trust.items")}
            </span>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground mb-4">
            {t("how.eyebrow")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-[-0.02em] max-w-2xl mb-14">
            {t("how.title")}
          </h2>
          <ol className="grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step} className="space-y-3">
                <div className="font-mono text-[40px] tracking-[-0.02em] text-primary/70 leading-none">
                  {t(`how.${step}.num`)}
                </div>
                <h3 className="text-[18px] font-medium tracking-[-0.01em]">
                  {t(`how.${step}.title`)}
                </h3>
                <p className="text-[14px] leading-relaxed text-muted-foreground max-w-sm">
                  {t(`how.${step}.desc`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features grid */}
        <section className="border-t border-border/60">
          <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
            <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground mb-4">
              {t("features.eyebrow")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-[-0.02em] max-w-2xl mb-16">
              {t("features.title")}
            </h2>
            <div className="grid gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-3 rounded-xl overflow-hidden border border-border/60">
              {features.map(({ key, illustration }) => (
                <article
                  key={key}
                  className="bg-background p-8 flex flex-col gap-6 hover:bg-muted/20 transition-colors"
                >
                  <div>{illustration}</div>
                  <div className="space-y-2">
                    <h3 className="text-[16px] font-medium tracking-[-0.01em]">
                      {t(`features.${key}.title`)}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      {t(`features.${key}.desc`)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Differentiator */}
        <section className="border-t border-border/60 bg-muted/20">
          <div className="max-w-4xl mx-auto px-6 py-28 sm:py-36 text-center">
            <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground mb-8">
              {t("differentiator.eyebrow")}
            </div>
            <blockquote className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.025em] leading-[1.15] text-foreground">
              <span className="text-muted-foreground/40">“</span>
              {t("differentiator.quote")}
              <span className="text-muted-foreground/40">”</span>
            </blockquote>
            <p className="mt-10 max-w-xl mx-auto text-[15px] leading-relaxed text-muted-foreground">
              {t("differentiator.detail")}
            </p>
          </div>
        </section>

        {/* Open model */}
        <section className="border-t border-border/60">
          <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32 grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground mb-4">
                {t("openModel.eyebrow")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-[-0.02em] mb-5">
                {t("openModel.title")}
              </h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground max-w-md">
                {t("openModel.desc")}
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {[
                { icon: PenLine, key: "itemCreate" },
                { icon: GitFork, key: "itemFork" },
                { icon: Share2, key: "itemShare" },
              ].map(({ icon: Icon, key }) => (
                <li
                  key={key}
                  className="flex items-center gap-4 rounded-lg border border-border bg-background px-5 py-4"
                >
                  <Icon className="size-4 text-primary shrink-0" strokeWidth={1.75} />
                  <span className="text-[14px] font-medium">{t(`openModel.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/60">
          <div className="max-w-3xl mx-auto px-6 py-28 sm:py-36 text-center">
            <h2 className="text-4xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.1]">
              {t("finalCta.title")}
            </h2>
            <p className="mt-6 text-[15px] text-muted-foreground">{t("finalCta.subhead")}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-foreground text-background text-[14px] font-medium hover:opacity-85 transition-opacity"
              >
                {t("finalCta.ctaPrimary")}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center h-11 px-5 rounded-lg border border-border bg-background text-[14px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                {t("finalCta.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
