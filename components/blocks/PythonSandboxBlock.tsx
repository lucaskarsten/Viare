"use client";

import { useRef, useState } from "react";

const TIMEOUT_MS = 15_000;

interface Props {
  initialCode?: string;
}

export default function PythonSandboxBlock({ initialCode }: Props) {
  const [code, setCode] = useState(initialCode ?? 'print("Olá, mundo!")');
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getWorker(): Worker {
    if (!workerRef.current) {
      workerRef.current = new Worker("/pyodide-worker.js");
    }
    return workerRef.current;
  }

  function terminateWorker() {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function run() {
    setRunning(true);
    setOutput("Carregando Python…");
    const worker = getWorker();
    const id = Date.now();

    worker.onmessage = (e) => {
      if (e.data.id !== id) return;
      clearTimeout(timeoutRef.current!);
      terminateWorker();
      setOutput(e.data.error ? `Erro: ${e.data.error}` : e.data.output);
      setRunning(false);
    };

    worker.onerror = (e) => {
      clearTimeout(timeoutRef.current!);
      terminateWorker();
      setOutput(`Erro: ${e.message || "falha no worker"}`);
      setRunning(false);
    };

    timeoutRef.current = setTimeout(() => {
      terminateWorker();
      setOutput("Erro: tempo de execução excedido (15s)");
      setRunning(false);
    }, TIMEOUT_MS);

    worker.postMessage({ id, code });
  }

  function stop() {
    terminateWorker();
    setOutput("Execução interrompida.");
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
      {running ? (
        <button className="python-sandbox-run" onClick={stop}>
          Parar
        </button>
      ) : (
        <button className="python-sandbox-run" onClick={run}>
          ▶ Executar
        </button>
      )}
      {output && <pre className="python-sandbox-output">{output}</pre>}
    </div>
  );
}
