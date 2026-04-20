"use client";

import dynamic from "next/dynamic";
import type { SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";

const Sandpack = dynamic(
  () => import("@codesandbox/sandpack-react").then((m) => m.Sandpack),
  { ssr: false, loading: () => <div className="sandpack-loading">Loading editor…</div> }
);

const ALLOWED_TEMPLATES: SandpackPredefinedTemplate[] = [
  "react",
  "react-ts",
  "vanilla",
  "vanilla-ts",
  "vue",
  "node",
  "static",
];

export default function SandpackBlock({ template = "react" }: { template?: string }) {
  const safeTemplate: SandpackPredefinedTemplate = ALLOWED_TEMPLATES.includes(
    template as SandpackPredefinedTemplate
  )
    ? (template as SandpackPredefinedTemplate)
    : "react";

  return (
    <div className="sandpack-block">
      <Sandpack
        template={safeTemplate}
        options={{
          showNavigator: false,
          showTabs: true,
          editorHeight: 320,
          showLineNumbers: true,
          wrapContent: true,
        }}
        theme="auto"
      />
    </div>
  );
}
