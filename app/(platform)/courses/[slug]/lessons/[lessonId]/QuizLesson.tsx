"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

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
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(isCompleted);
  const [score, setScore] = useState<number | null>(isCompleted ? null : null);

  if (questions.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma questão encontrada.</p>;
  }

  const question = questions[current];
  const answered = answers[current] !== null;
  const isLast = current === questions.length - 1;

  function selectOption(index: number) {
    if (answered || submitted) return;
    const newAnswers = [...answers];
    newAnswers[current] = index;
    setAnswers(newAnswers);
    setSelected(index);
  }

  async function finish() {
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);

    await fetch("/api/courses/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    router.refresh();
  }

  if (submitted && score !== null) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="text-5xl font-medium text-accent tabular-nums">
          {score}
          <span className="text-2xl text-muted-foreground">%</span>
        </div>
        <p className="text-muted-foreground">
          {answers.filter((a, i) => a === questions[i].correctIndex).length} de {questions.length} corretas
        </p>
        <div className="grid gap-3 text-left max-w-lg mx-auto">
          {questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <div key={q.id} className={`rounded-lg border p-3 text-sm ${correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-base leading-none mt-0.5 shrink-0 ${correct ? "text-green-600" : "text-red-600"}`}>
                    {correct ? "✓" : "✗"}
                  </span>
                  <div>
                    <p className="font-medium">{q.question}</p>
                    <p className="text-muted-foreground text-xs mt-1">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl font-medium text-accent tabular-nums mb-3">✓</div>
        <p className="font-semibold">Quiz já concluído!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Questão {current + 1} de {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`w-4 h-[3px] rounded-[1px] ${answers[i] !== null ? "bg-accent" : i === current ? "bg-accent opacity-60" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <p className="font-medium text-base">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = answers[current] === i;
          const isCorrect = answered && i === question.correctIndex;
          const isWrong = answered && isSelected && !isCorrect;

          const stateClasses = isCorrect
            ? "border-green-500/50 bg-green-500/8 text-green-800 dark:text-green-300"
            : isWrong
            ? "border-red-500/50 bg-red-500/8 text-red-800 dark:text-red-300"
            : isSelected
            ? "border-accent bg-accent/5"
            : "border-border bg-background hover:border-muted-foreground/40";

          const letterClasses = isCorrect
            ? "border-green-500 bg-green-500 text-white"
            : isWrong
            ? "border-red-500 bg-red-500 text-white"
            : isSelected
            ? "border-accent text-accent bg-accent/10"
            : "border-border text-muted-foreground";

          return (
            <button
              key={i}
              onClick={() => selectOption(i)}
              disabled={answered}
              className={`w-full grid grid-cols-[28px_1fr_20px] items-center gap-3 border rounded px-3 py-3 text-left text-[14px] transition-colors disabled:cursor-default ${stateClasses}`}
            >
              <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-medium font-mono ${letterClasses}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
              <span className="text-center text-base">
                {isCorrect ? "✓" : isWrong ? "✗" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`rounded-lg p-3 text-sm ${answers[current] === question.correctIndex ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {question.explanation}
        </div>
      )}

      {answered && (
        <div className="flex justify-end">
          {isLast ? (
            <button
              onClick={finish}
              className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Ver resultado
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => { setCurrent(current + 1); setSelected(null); }}
              className="flex items-center gap-2 rounded-md border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
