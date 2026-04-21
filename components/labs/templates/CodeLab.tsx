"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { useTranslations } from "next-intl";
import type { CodeLabConfig } from "@/lib/labs/templates/registry";
import PythonSandboxBlock from "@/components/blocks/PythonSandboxBlock";

interface Props {
  config: CodeLabConfig;
}

function sandpackTemplate(language: CodeLabConfig["language"]): "react" | "vanilla" {
  if (language === "typescript") return "react";
  return "vanilla";
}

export default function CodeLab({ config }: Props) {
  const t = useTranslations("lab");

  if (config.language === "python") {
    const initialCode =
      config.files["index.py"] ?? config.files[Object.keys(config.files)[0]] ?? "";
    return (
      <div className="lab-template-code">
        <div className="lab-template-instructions md-body">
          <p>{config.instructions}</p>
        </div>
        <PythonSandboxBlock initialCode={initialCode} />
        {config.testCode && (
          <div className="lab-template-tests">
            <div className="lab-label">{t("scenario")}</div>
            <pre className="lab-test-code">{config.testCode}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lab-template-code">
      <div className="lab-template-instructions md-body">
        <p>{config.instructions}</p>
      </div>

      <SandpackProvider
        template={sandpackTemplate(config.language)}
        files={config.files}
        theme="auto"
      >
        <SandpackLayout>
          <SandpackCodeEditor showLineNumbers showTabs />
          <SandpackPreview showOpenInCodeSandbox={false} />
        </SandpackLayout>
      </SandpackProvider>

      {config.testCode && (
        <div className="lab-template-tests">
          <div className="lab-label">{t("scenario")}</div>
          <pre className="lab-test-code">{config.testCode}</pre>
        </div>
      )}
    </div>
  );
}
