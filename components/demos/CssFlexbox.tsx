"use client";

import { useState } from "react";

type FlexDir = "row" | "row-reverse" | "column" | "column-reverse";
type JustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";
type AlignItems = "stretch" | "flex-start" | "flex-end" | "center";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

const COLORS = ["#4a6fa5", "#5a7a4a", "#c98a2e", "#a94442", "#7a5a9a", "#3a8a8a"];

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="demo-fx-control">
      <span className="demo-fx-label">{label}</span>
      <div className="demo-fx-opts">
        {options.map((o) => (
          <button
            key={o}
            className={`demo-fx-opt${value === o ? " active" : ""}`}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CssFlexbox() {
  const [dir, setDir] = useState<FlexDir>("row");
  const [justify, setJustify] = useState<JustifyContent>("flex-start");
  const [align, setAlign] = useState<AlignItems>("stretch");
  const [wrap, setWrap] = useState<FlexWrap>("nowrap");
  const [gap, setGap] = useState(8);
  const [count, setCount] = useState(4);

  const css = [
    `display: flex;`,
    `flex-direction: ${dir};`,
    `justify-content: ${justify};`,
    `align-items: ${align};`,
    `flex-wrap: ${wrap};`,
    `gap: ${gap}px;`,
  ].join("\n");

  const isRow = dir === "row" || dir === "row-reverse";

  return (
    <div className="demo-block demo-flexbox">
      <div className="demo-header">
        <span className="demo-title">CSS Flexbox Playground</span>
      </div>

      <div className="demo-fx-layout">
        <div className="demo-fx-panel">
          <Select
            label="flex-direction"
            value={dir}
            options={["row", "row-reverse", "column", "column-reverse"]}
            onChange={setDir}
          />
          <Select
            label="justify-content"
            value={justify}
            options={[
              "flex-start",
              "flex-end",
              "center",
              "space-between",
              "space-around",
              "space-evenly",
            ]}
            onChange={setJustify}
          />
          <Select
            label="align-items"
            value={align}
            options={["stretch", "flex-start", "flex-end", "center"]}
            onChange={setAlign}
          />
          <Select
            label="flex-wrap"
            value={wrap}
            options={["nowrap", "wrap", "wrap-reverse"]}
            onChange={setWrap}
          />
          <div className="demo-fx-control">
            <span className="demo-fx-label">gap: {gap}px</span>
            <input
              type="range"
              min={0}
              max={32}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div className="demo-fx-control">
            <span className="demo-fx-label">items: {count}</span>
            <input
              type="range"
              min={2}
              max={6}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div className="demo-fx-right">
          <div
            className="demo-fx-preview"
            style={{
              display: "flex",
              flexDirection: dir,
              justifyContent: justify,
              alignItems: align,
              flexWrap: wrap,
              gap,
            }}
          >
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                className="demo-fx-item"
                style={{
                  background: COLORS[i % COLORS.length],
                  width: isRow ? 40 + i * 6 : "60%",
                  height: isRow ? 32 + i * 8 : 32 + i * 6,
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <pre className="demo-fx-code">{css}</pre>
        </div>
      </div>
    </div>
  );
}
