importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js");

let pyodide = null;

async function loadPyodideIfNeeded() {
  if (!pyodide) {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/",
    });
  }
}

const MAX_OUTPUT = 50_000;

self.onmessage = async (e) => {
  const { id, code } = e.data;
  try {
    await loadPyodideIfNeeded();
    const lines = [];
    pyodide.setStdout({ batched: (s) => lines.push(s) });
    pyodide.setStderr({ batched: (s) => lines.push(`Erro: ${s}`) });
    await pyodide.runPythonAsync(code);
    let output = lines.join("\n") || "(sem saída)";
    if (output.length > MAX_OUTPUT) {
      output = output.slice(0, MAX_OUTPUT) + "\n... (saída truncada)";
    }
    self.postMessage({ id, output });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
