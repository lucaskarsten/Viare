"use client";

import { useEffect, useRef, useState } from "react";

interface PyodideInterface {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";
const DEFAULT_CODE = 'print("Olá, mundo!")';

interface Props {
  initialCode?: string;
}

export default function PythonSandboxBlock({ initialCode }: Props) {
  const [code, setCode] = useState(initialCode ?? DEFAULT_CODE);
  const [output, setOutput] = useState("");
  const [pyodideReady, setPyodideReady] = useState(false);
  const [running, setRunning] = useState(false);
  const pyRef = useRef<PyodideInterface | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = async () => {
      if (!window.loadPyodide) return;
      pyRef.current = await window.loadPyodide({ indexURL: PYODIDE_CDN });
      setPyodideReady(true);
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  async function run() {
    const py = pyRef.current;
    if (!py) return;
    setRunning(true);
    const lines: string[] = [];
    py.setStdout({ batched: (s) => lines.push(s) });
    py.setStderr({ batched: (s) => lines.push(`Erro: ${s}`) });
    try {
      await py.runPythonAsync(code);
    } catch (e) {
      lines.push(`Erro: ${String(e)}`);
    }
    setOutput(lines.join("\n") || "(sem saída)");
    setRunning(false);
  }

  return (
    <div className="python-sandbox">
      <textarea
        className="python-sandbox-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={8}
      />
      <button className="python-sandbox-run" onClick={run} disabled={!pyodideReady || running}>
        {running ? "Executando…" : pyodideReady ? "▶ Executar" : "Carregando Python…"}
      </button>
      {output && <pre className="python-sandbox-output">{output}</pre>}
    </div>
  );
}
