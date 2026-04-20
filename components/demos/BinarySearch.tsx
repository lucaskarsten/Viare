"use client";

import { useState } from "react";

const ARRAY = [3, 7, 12, 18, 24, 31, 39, 45, 52, 61, 73, 85, 94];

type StepResult = "found" | "go-left" | "go-right" | "not-found";
type SearchStep = { left: number; right: number; mid: number; result: StepResult };

function runSearch(arr: number[], target: number): SearchStep[] {
  const steps: SearchStep[] = [];
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      steps.push({ left, right, mid, result: "found" });
      return steps;
    } else if (arr[mid] < target) {
      steps.push({ left, right, mid, result: "go-right" });
      left = mid + 1;
    } else {
      steps.push({ left, right, mid, result: "go-left" });
      right = mid - 1;
    }
  }
  const last = steps[steps.length - 1];
  if (last) steps.push({ ...last, result: "not-found" });
  return steps;
}

const STATUS: Record<StepResult, (mid: number, target: number, arr: number[]) => string> = {
  found: (mid, _, arr) => `✓ Found at index ${mid} (value ${arr[mid]})`,
  "go-right": (mid, target, arr) => `${arr[mid]} < ${target} → search right half`,
  "go-left": (mid, target, arr) => `${arr[mid]} > ${target} → search left half`,
  "not-found": (_, target) => `✗ ${target} not in array`,
};

export default function BinarySearch() {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<number | null>(null);
  const [steps, setSteps] = useState<SearchStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);

  function search() {
    const t = parseInt(input.trim());
    if (isNaN(t)) return;
    setTarget(t);
    const s = runSearch(ARRAY, t);
    setSteps(s);
    setStepIdx(0);
  }

  const current = steps[stepIdx];
  const isLast = stepIdx >= steps.length - 1;

  function cellState(i: number): "found" | "mid" | "active" | "eliminated" {
    if (!current) return "active";
    if (current.result === "not-found") return "eliminated";
    if (current.result === "found" && i === current.mid) return "found";
    if (i === current.mid) return "mid";
    if (i < current.left || i > current.right) return "eliminated";
    return "active";
  }

  const BG: Record<string, string> = {
    found: "var(--ok)",
    mid: "var(--rating-hard)",
    active: "var(--vr-accent-soft)",
    eliminated: "var(--paper-2)",
  };
  const COLOR: Record<string, string> = {
    found: "#fff",
    mid: "#fff",
    active: "var(--ink)",
    eliminated: "var(--ink-4)",
  };

  return (
    <div className="demo-block">
      <div className="demo-header">
        <span className="demo-title">Binary Search</span>
        {target !== null && steps.length > 0 && (
          <span className="demo-badge">
            Step {stepIdx + 1} / {steps.length}
          </span>
        )}
      </div>

      <div className="demo-bs-row">
        {ARRAY.map((v, i) => {
          const state = cellState(i);
          return (
            <div
              key={i}
              className="demo-bs-cell"
              style={{
                background: BG[state],
                color: COLOR[state],
                border: `1px solid ${state === "mid" || state === "found" ? "transparent" : "var(--rule)"}`,
                outline:
                  state === "mid"
                    ? "2px solid var(--rating-hard)"
                    : state === "found"
                      ? "2px solid var(--ok)"
                      : "none",
              }}
            >
              <span className="demo-bs-val">{v}</span>
              {state === "mid" && <span className="demo-bs-pointer">mid</span>}
              {current && i === current.left && state === "active" && (
                <span className="demo-bs-pointer">L</span>
              )}
              {current && i === current.right && state === "active" && (
                <span className="demo-bs-pointer">R</span>
              )}
            </div>
          );
        })}
      </div>

      {current && (
        <div
          className="demo-status"
          style={{
            color:
              current.result === "found"
                ? "var(--ok)"
                : current.result === "not-found"
                  ? "var(--danger)"
                  : "var(--ink-2)",
          }}
        >
          {STATUS[current.result](current.mid, target ?? 0, ARRAY)}
        </div>
      )}

      <div className="demo-controls">
        <input
          className="demo-input"
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Enter a number…"
        />
        <button className="demo-btn demo-btn-primary" onClick={search}>
          Search
        </button>
        {steps.length > 0 && (
          <>
            <button
              className="demo-btn"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={stepIdx === 0}
            >
              ← Back
            </button>
            <button
              className="demo-btn"
              onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
              disabled={isLast}
            >
              Next →
            </button>
          </>
        )}
      </div>

      <p className="demo-hint">Try searching for a value in the sorted array above.</p>
    </div>
  );
}
