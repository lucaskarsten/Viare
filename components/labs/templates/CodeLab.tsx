"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { useTranslations } from "next-intl";
import type { CodeLabConfig } from "@/lib/labs/templates/registry";

interface Props {
  config: CodeLabConfig;
}

function sandpackTemplate(language: CodeLabConfig["language"]): "react" | "vanilla" | "node" {
  if (language === "typescript") return "react";
  if (language === "javascript") return "vanilla";
  return "node";
}

export default function CodeLab({ config }: Props) {
  const t = useTranslations("lab");

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
