"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { InteractiveCalculatorConfig } from "@/lib/labs/templates/registry";

interface Props {
  config: InteractiveCalculatorConfig;
}

function evalFormula(formula: string, values: Record<string, number>): number | null {
  try {
    const varNames = Object.keys(values);
    const varValues = varNames.map((k) => values[k]);
    // variables are numbers only — controlled inputs, try/catch for syntax errors
    const fn = new Function(...varNames, `return (${formula});`) as (...args: number[]) => number;
    const result = fn(...varValues);
    if (!Number.isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

export default function InteractiveCalculator({ config }: Props) {
  const t = useTranslations("lab");

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(config.variables.map((v) => [v.name, v.default]))
  );

  const result = evalFormula(config.formula, values);

  function handleChange(name: string, raw: string) {
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) {
      setValues((prev) => ({ ...prev, [name]: n }));
    }
  }

  return (
    <div className="lab-template-calc">
      <div className="lab-template-instructions md-body">
        <p>{config.instructions}</p>
      </div>

      <div className="lab-calc-variables">
        {config.variables.map((v) => (
          <div key={v.name} className="lab-calc-row">
            <div className="lab-calc-label-row">
              <span className="lab-calc-label">{v.label}</span>
              <span className="lab-calc-value">{values[v.name]}</span>
            </div>
            <input
              type="range"
              min={v.min}
              max={v.max}
              step={v.step}
              value={values[v.name]}
              onChange={(e) => handleChange(v.name, e.target.value)}
              className="lab-calc-slider"
            />
          </div>
        ))}
      </div>

      <div className="lab-calc-result">
        <span className="lab-calc-result-label">{config.resultLabel}</span>
        <span className="lab-calc-result-value">
          {result !== null
            ? result.toLocaleString(undefined, { maximumFractionDigits: 4 })
            : t("templateUnavailable")}
        </span>
      </div>
    </div>
  );
}
