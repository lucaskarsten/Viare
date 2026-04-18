"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";

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
  const [selected, setSelected] = useState<number | null>(null);
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
        <div className="text-6xl font-bold tabular-nums">
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
                  {correct ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  )}
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
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
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
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === current ? "bg-primary" : answers[i] !== null ? "bg-green-400" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <p className="font-medium text-base">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = answers[current] === i;
          const isCorrect = i === question.correctIndex;
          const showResult = answered;

          let style = "border bg-background hover:bg-muted/50 text-foreground";
          if (showResult && isSelected && isCorrect) style = "border-green-500 bg-green-50 text-green-800";
          else if (showResult && isSelected && !isCorrect) style = "border-red-500 bg-red-50 text-red-800";
          else if (showResult && isCorrect) style = "border-green-300 bg-green-50/50 text-green-700";
          else if (isSelected) style = "border-primary bg-primary/5";

          return (
            <button
              key={i}
              onClick={() => selectOption(i)}
              disabled={answered}
              className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-colors ${style} disabled:cursor-default`}
            >
              <span className="font-mono text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
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
