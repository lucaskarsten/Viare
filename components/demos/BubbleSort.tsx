"use client";

import { useState, useEffect, useRef } from "react";

const INITIAL = [64, 34, 25, 12, 22, 11, 90, 45, 67, 33];
const MAX_VAL = Math.max(...INITIAL);

type Step = {
  array: number[];
  comparing: [number, number] | null;
  swapped: boolean;
  sortedFrom: number;
};

function buildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  let sortedFrom = n;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ array: [...a], comparing: [j, j + 1], swapped: false, sortedFrom });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ array: [...a], comparing: [j, j + 1], swapped: true, sortedFrom });
      }
    }
    sortedFrom = n - i - 1;
    steps.push({ array: [...a], comparing: null, swapped: false, sortedFrom });
  }
  steps.push({ array: [...a], comparing: null, swapped: false, sortedFrom: 0 });
  return steps;
}

const STEPS = buildSteps(INITIAL);

export default function BubbleSort() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(350);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = STEPS[idx];
  const isLast = idx >= STEPS.length - 1;
  const effectivePlaying = playing && !isLast;

  useEffect(() => {
    if (!effectivePlaying) return;
    timer.current = setTimeout(() => setIdx((i) => i + 1), speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [effectivePlaying, idx, speed]);

  function reset() {
    setPlaying(false);
    setIdx(0);
  }

  function barColor(i: number): string {
    if (step.comparing === null && i >= step.sortedFrom) return "var(--ok)";
    if (step.comparing?.includes(i)) return step.swapped ? "var(--danger)" : "var(--rating-hard)";
    if (i >= step.sortedFrom) return "color-mix(in oklch, var(--ok), transparent 50%)";
    return "var(--vr-accent)";
  }

  return (
    <div className="demo-block">
      <div className="demo-header">
        <span className="demo-title">Bubble Sort</span>
        <span className="demo-badge">
          Step {idx + 1} / {STEPS.length}
        </span>
      </div>

      <div className="demo-bars-wrap">
        {step.array.map((v, i) => (
          <div key={i} className="demo-bar-col">
            <div
              className="demo-bar"
              style={{
                height: `${(v / MAX_VAL) * 140}px`,
                background: barColor(i),
              }}
            />
            <span className="demo-bar-label">{v}</span>
          </div>
        ))}
      </div>

      <div className="demo-legend">
        <span style={{ color: "var(--vr-accent)" }}>■ unsorted</span>
        <span style={{ color: "var(--rating-hard)" }}>■ comparing</span>
        <span style={{ color: "var(--danger)" }}>■ swapping</span>
        <span style={{ color: "var(--ok)" }}>■ sorted</span>
      </div>

      <div className="demo-controls">
        <button className="demo-btn" onClick={reset}>
          ↺
        </button>
        <button
          className="demo-btn"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0 || playing}
        >
          ←
        </button>
        <button
          className="demo-btn demo-btn-primary"
          onClick={() => setPlaying((p) => !p)}
          disabled={isLast}
        >
          {effectivePlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          className="demo-btn"
          onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          disabled={isLast || playing}
        >
          →
        </button>
        <label className="demo-speed-label">
          Speed
          <input
            type="range"
            min={80}
            max={700}
            step={50}
            value={750 - speed}
            onChange={(e) => setSpeed(750 - Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
