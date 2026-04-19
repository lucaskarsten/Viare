"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const STEPS = 4;

const INTEREST_IDS = [
  "tech",
  "craft",
  "music",
  "business",
  "language",
  "science",
  "history",
  "art",
  "health",
  "philosophy",
] as const;

const PACE_IDS = ["casual", "moderate", "intense"] as const;
const STYLE_IDS = ["reading", "mixed", "practical"] as const;

const SUGGESTIONS = ["Kali Linux", "Piano", "Pão artesanal"];

type PaceId = (typeof PACE_IDS)[number];
type StyleId = (typeof STYLE_IDS)[number];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [pace, setPace] = useState<PaceId>("moderate");
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [style, setStyle] = useState<StyleId>("mixed");
  const [topic, setTopic] = useState("");

  const toggleInterest = (id: string) =>
    setInterests((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleDay = (i: number) =>
    setDays((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const handleFinish = () => {
    const prefs = { name, interests, pace, days, style, topic };
    try {
      localStorage.setItem("viare_onboarding", JSON.stringify(prefs));
    } catch {
      // localStorage unavailable, continue anyway
    }
    router.push(`/courses/generate?topic=${encodeURIComponent(topic)}`);
  };

  const isPrimaryDisabled =
    (step === 0 && !name.trim()) || (step === 3 && !topic.trim());

  const dayLabels = t.raw("days") as string[];

  return (
    <div className="onboarding">
      {/* Header */}
      <div className="onb-chrome">
        <div className="onb-brand">
          <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: "var(--vr-accent)" }}>
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          Viare
        </div>
        <div className="onb-steps">
          {Array(STEPS).fill(0).map((_, i) => (
            <div
              key={i}
              className={`onb-step${i < step ? " on" : i === step ? " current" : ""}`}
            />
          ))}
        </div>
        <div className="onb-lang">
          <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
      </div>

      {/* Main content */}
      <div className="onb-main">
        <div className="onb-slide" key={step}>

          {step === 0 && (
            <>
              <div className="onb-eye">{t("step", { current: 1, total: STEPS })}</div>
              <h1 className="onb-h1">
                {t("step0.title")} <span className="onb-soft">{t("step0.titleSoft")}</span>
              </h1>
              <p className="onb-lede">{t("step0.lede")}</p>
              <input
                autoFocus
                className="onb-input big"
                placeholder={t("step0.placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isPrimaryDisabled && setStep((s) => s + 1)}
              />
            </>
          )}

          {step === 1 && (
            <>
              <div className="onb-eye">{t("step", { current: 2, total: STEPS })}</div>
              <h1 className="onb-h1">
                {t("step1.title")} <span className="onb-soft">{t("step1.titleSoft")}</span>
              </h1>
              <p className="onb-lede">{t("step1.lede")}</p>
              <div className="onb-chips">
                {INTEREST_IDS.map((id) => (
                  <button
                    key={id}
                    className={`onb-chip${interests.includes(id) ? " on" : ""}`}
                    onClick={() => toggleInterest(id)}
                  >
                    <div className="oc-label">{t(`interests.${id}`)}</div>
                    <div className="oc-ex">{t(`interests.${id}Ex`)}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="onb-eye">{t("step", { current: 3, total: STEPS })}</div>
              <h1 className="onb-h1">
                {t("step2.title")} <span className="onb-soft">{t("step2.titleSoft")}</span>
              </h1>
              <div className="onb-group">
                <div className="onb-group-label">{t("step2.pace")}</div>
                <div className="onb-seg">
                  {PACE_IDS.map((p) => (
                    <button
                      key={p}
                      className={`onb-segbtn${pace === p ? " on" : ""}`}
                      onClick={() => setPace(p)}
                    >
                      {t(`pace.${p}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="onb-group">
                <div className="onb-group-label">{t("step2.daysPerWeek")}</div>
                <div className="onb-days">
                  {dayLabels.map((d, i) => (
                    <button
                      key={i}
                      className={`onb-day${days.includes(i) ? " on" : ""}`}
                      onClick={() => toggleDay(i)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="onb-day-hint">{t("step2.daysSelected", { count: days.length })}</p>
              </div>
              <div className="onb-group">
                <div className="onb-group-label">{t("step2.style")}</div>
                <div className="onb-seg">
                  {STYLE_IDS.map((s) => (
                    <button
                      key={s}
                      className={`onb-segbtn${style === s ? " on" : ""}`}
                      onClick={() => setStyle(s)}
                    >
                      {t(`style.${s}`)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="onb-eye">{t("step", { current: 4, total: STEPS })}</div>
              <h1 className="onb-h1">
                {t("step3.title")} <span className="onb-soft">{t("step3.titleSoft")}</span>
              </h1>
              <p className="onb-lede">{t("step3.lede")}</p>
              <textarea
                autoFocus
                className="onb-textarea"
                placeholder={t("step3.placeholder")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <div className="onb-suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="onb-suggest-chip" onClick={() => setTopic(s)}>
                    {s}
                  </button>
                ))}
              </div>
              {topic && (
                <div className="onb-preview">
                  <div className="op-label">{t("step3.preview")}</div>
                  <div className="op-card">
                    <div className="op-visual" />
                    <div>
                      <div className="op-title">{topic}</div>
                      <div className="op-meta">
                        {t("step3.previewMeta", { pace: t(`pace.${pace}`), days: days.length, style: t(`style.${style}`) })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="onb-foot">
        <button
          className="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          {t("footer.back")}
        </button>
        <div className="onb-foot-spacer" />
        {step < STEPS - 1 && (
          <button className="ghost" onClick={() => setStep((s) => s + 1)}>
            {t("footer.skip")}
          </button>
        )}
        <button
          className="primary"
          onClick={step < STEPS - 1 ? () => setStep((s) => s + 1) : handleFinish}
          disabled={isPrimaryDisabled}
        >
          {step < STEPS - 1 ? t("footer.next") : t("footer.finish")}
        </button>
      </div>
    </div>
  );
}
