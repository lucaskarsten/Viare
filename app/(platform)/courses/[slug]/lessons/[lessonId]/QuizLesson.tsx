"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type Props = {
  lessonId: string;
  questions: Question[];
  isCompleted: boolean;
};

export default function QuizLesson({ lessonId, questions, isCompleted }: Props) {
  const t = useTranslations("quiz");
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(isCompleted);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [serverAnswers, setServerAnswers] = useState<
    Array<{
      questionId: string;
      correct: boolean;
      correctIndex: number | null;
      explanation: string | null;
    }>
  >([]);

  if (questions.length === 0) {
    return <p style={{ color: "var(--ink-3)" }}>{t("noQuestions")}</p>;
  }

  const question = questions[current];
  const answered = answers[current] !== null;
  const isLast = current === questions.length - 1;

  function selectOption(index: number) {
    if (answered || submitted) return;
    const next = [...answers];
    next[current] = index;
    setAnswers(next);
  }

  async function finish() {
    setSubmitting(true);
    const payload = answers.map((selectedIndex, i) => ({
      questionId: questions[i].id,
      selectedIndex: selectedIndex ?? 0,
    }));
    try {
      const res = await fetch(`/api/quiz/${lessonId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.pct);
        setServerAnswers(data.answers);
      } else {
        const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
        setScore(Math.round((correct / questions.length) * 100));
      }
    } catch {
      const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
      setScore(Math.round((correct / questions.length) * 100));
    }
    setSubmitting(false);
    setSubmitted(true);
    router.refresh();
  }

  if (submitted && score !== null) {
    const correctCount =
      serverAnswers.length > 0
        ? serverAnswers.filter((a) => a.correct).length
        : answers.filter((a, i) => a === questions[i].correctIndex).length;
    return (
      <div className="quiz">
        <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
          <div
            style={{
              fontSize: "3.5rem",
              fontWeight: 500,
              color: "var(--accent)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {score}
            <span style={{ fontSize: "1.5rem", color: "var(--ink-3)" }}>%</span>
          </div>
          <p style={{ color: "var(--ink-3)", marginTop: "0.25rem" }}>
            {t("correctOf", { correct: correctCount, total: questions.length })}
          </p>
        </div>
        <div style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
          {questions.map((q, i) => {
            const sa = serverAnswers.find((a) => a.questionId === q.id);
            const correct = sa ? sa.correct : answers[i] === q.correctIndex;
            const explanation = sa?.explanation ?? q.explanation;
            return (
              <div key={q.id} className={`quiz-feedback ${correct ? "ok" : "no"}`}>
                <strong>
                  {correct ? "✓" : "✗"} {q.question}
                </strong>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85em", opacity: 0.85 }}>
                  {explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="quiz" style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ fontSize: "3rem", color: "var(--ok)" }}>✓</div>
        <p>{t("alreadyCompleted")}</p>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-label">
        {t("questionOf", { current: current + 1, total: questions.length })}
      </div>
      <div key={current} style={{ animation: "quizIn 0.22s ease-out" }}>
        <div className="quiz-q">{question.question}</div>
        <div className="quiz-options">
          {question.options.map((option, i) => {
            const isSelected = answers[current] === i;
            const isCorrect = answered && i === question.correctIndex;
            const isWrong = answered && isSelected && !isCorrect;
            const stateClass = isCorrect
              ? "correct"
              : isWrong
                ? "wrong"
                : isSelected
                  ? "selected"
                  : "";
            return (
              <button
                key={i}
                className={`quiz-opt${stateClass ? ` ${stateClass}` : ""}`}
                onClick={() => selectOption(i)}
                disabled={answered}
              >
                <span className="qk">{String.fromCharCode(97 + i)}</span>
                <span className="qt">{option}</span>
                {isCorrect && <span className="qmark">✓</span>}
                {isWrong && <span className="qmark">✗</span>}
              </button>
            );
          })}
        </div>
        <div className="quiz-actions">
          {answered && (
            <div
              className={`quiz-feedback ${answers[current] === question.correctIndex ? "ok" : "no"}`}
            >
              {question.explanation}
            </div>
          )}
          {answered &&
            (isLast ? (
              <button className="primary" onClick={finish} disabled={submitting}>
                {t("seeResult")}
              </button>
            ) : (
              <button className="ghost" onClick={() => setCurrent(current + 1)}>
                {t("next")}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
