"use client";

import { useState } from "react";

export type QuizBlockQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type Props = {
  questions: QuizBlockQuestion[];
};

export default function QuizBlock({ questions }: Props) {
  if (questions.length === 0) return null;
  return (
    <>
      {questions.map((q, qi) => (
        <QuizItem key={q.id} question={q} index={qi} />
      ))}
    </>
  );
}

function QuizItem({ question, index }: { question: QuizBlockQuestion; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correctIdx = question.correctIndex;
  const isRight = selected === correctIdx;

  return (
    <div className="quiz">
      <div className="quiz-label">
        Múltipla escolha · questão {index + 1}
      </div>
      <div className="quiz-q">{question.question}</div>
      <div className="quiz-options">
        {question.options.map((opt, i) => {
          const letter = String.fromCharCode(97 + i);
          const state = submitted
            ? i === correctIdx
              ? "correct"
              : selected === i
                ? "wrong"
                : "idle"
            : selected === i
              ? "selected"
              : "idle";
          return (
            <button
              key={i}
              className={`quiz-opt ${state}`}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
            >
              <span className="qk">{letter}</span>
              <span className="qt">{opt}</span>
              {state === "correct" && <span className="qmark">✓</span>}
              {state === "wrong" && <span className="qmark">✗</span>}
            </button>
          );
        })}
      </div>
      <div className="quiz-actions">
        {!submitted ? (
          <button
            className="primary"
            disabled={selected === null}
            onClick={() => setSubmitted(true)}
          >
            Conferir
          </button>
        ) : (
          <div className={`quiz-feedback ${isRight ? "ok" : "no"}`}>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
