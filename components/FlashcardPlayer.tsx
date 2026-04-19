"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type FlashCard = {
  front: string;
  back: string;
};

type Props = {
  cards: FlashCard[];
};

export default function FlashcardPlayer({ cards }: Props) {
  const t = useTranslations("flashcard");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return null;

  const prev = () => {
    setIdx((i) => Math.max(0, i - 1));
    setFlipped(false);
  };
  const next = () => {
    setIdx((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  };

  return (
    <div className="flash-player">
      <div
        className={`flash-card${flipped ? " flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="fc-face front">
          <div className="fc-eye">
            {t("questionOf", { current: idx + 1, total: cards.length })}
          </div>
          <div className="fc-text">{cards[idx].front}</div>
          <div className="fc-hint">{t("tapToReveal")}</div>
        </div>
        <div className="fc-face back">
          <div className="fc-eye">{t("answer")}</div>
          <div className="fc-text">{cards[idx].back}</div>
        </div>
      </div>
      <div className="flash-controls">
        <button className="ghost" onClick={prev} disabled={idx === 0}>
          {t("previous")}
        </button>
        <button className="chip">{t("hard")}</button>
        <button className="chip">{t("ok")}</button>
        <button className="chip">{t("easy")}</button>
        <button className="ghost" onClick={next} disabled={idx === cards.length - 1}>
          {t("next")}
        </button>
      </div>
    </div>
  );
}
