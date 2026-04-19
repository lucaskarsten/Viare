"use client";

import { useState } from "react";

export type FlashCard = {
  front: string;
  back: string;
};

type Props = {
  cards: FlashCard[];
};

export default function FlashcardPlayer({ cards }: Props) {
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
            Pergunta {idx + 1}/{cards.length}
          </div>
          <div className="fc-text">{cards[idx].front}</div>
          <div className="fc-hint">toque para revelar</div>
        </div>
        <div className="fc-face back">
          <div className="fc-eye">Resposta</div>
          <div className="fc-text">{cards[idx].back}</div>
        </div>
      </div>
      <div className="flash-controls">
        <button className="ghost" onClick={prev} disabled={idx === 0}>
          ← Anterior
        </button>
        <button className="chip">Difícil</button>
        <button className="chip">Ok</button>
        <button className="chip">Fácil</button>
        <button className="ghost" onClick={next} disabled={idx === cards.length - 1}>
          Próximo →
        </button>
      </div>
    </div>
  );
}
