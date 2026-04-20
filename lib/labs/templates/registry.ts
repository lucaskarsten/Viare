import { z } from "zod";
import type { ComponentType } from "react";

export const CTF_FLAG_PATTERN = /^FLAG\{[a-z0-9_-]+\}$/;
export const CtfFlagSchema = z.string().regex(CTF_FLAG_PATTERN);

export type TemplateLabType = "CTF" | "INTERACTIVE";

export type LabTemplate<TConfig = unknown> = {
  id: string;
  name: string;
  description: string;
  domains: string[];
  type: TemplateLabType;
  configSchema: z.ZodType<TConfig>;
  component: () => Promise<{ default: ComponentType<{ config: TConfig }> }>;
  version: number;
};

// RULE: LAB-05 — configSchema .strict() rejects unknown fields
const codeLabConfigSchema = z
  .object({
    language: z.enum(["javascript", "typescript", "python"]),
    files: z.record(z.string(), z.string()),
    testCode: z.string().optional(),
    instructions: z.string(),
  })
  .strict();

// RULE: LAB-05 — configSchema .strict() rejects unknown fields
const interactiveCalculatorConfigSchema = z
  .object({
    variables: z
      .array(
        z.object({
          name: z.string().min(1),
          label: z.string().min(1),
          min: z.number(),
          max: z.number(),
          step: z.number().positive(),
          default: z.number(),
        })
      )
      .min(1)
      .max(5),
    formula: z.string(),
    resultLabel: z.string(),
    instructions: z.string(),
  })
  .strict();

// RULE: LAB-05 — configSchema .strict() rejects unknown fields
const interactiveChartConfigSchema = z
  .object({
    chartType: z.enum(["bar", "line", "pie"]),
    datasets: z
      .array(
        z.object({
          label: z.string(),
          data: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })),
        })
      )
      .min(1),
    instructions: z.string(),
    interactiveAxes: z.boolean().optional().default(false),
  })
  .strict();

// RULE: LAB-05 — configSchema .strict() rejects unknown fields
const interactiveTimelineConfigSchema = z
  .object({
    events: z
      .array(
        z.object({
          date: z.string().min(1),
          label: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .min(2)
      .max(20),
    orientation: z.enum(["horizontal", "vertical"]).optional().default("horizontal"),
    instructions: z.string(),
  })
  .strict();

// RULE: LAB-05 — configSchema .strict() rejects unknown fields
const interactiveMapConfigSchema = z
  .object({
    center: z.object({ lat: z.number(), lng: z.number() }),
    zoom: z.number().int().min(1).max(18).default(5),
    markers: z
      .array(
        z.object({
          lat: z.number(),
          lng: z.number(),
          label: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .min(1)
      .max(20),
    instructions: z.string(),
  })
  .strict();

// RULE: LAB-05 — configSchema .strict() rejects unknown fields
const interactivePianoConfigSchema = z
  .object({
    scale: z.enum(["major", "minor", "pentatonic"]).optional().default("major"),
    rootNote: z.enum(["C", "D", "E", "F", "G", "A", "B"]).optional().default("C"),
    octaves: z.number().int().min(1).max(3).default(2),
    exerciseNotes: z.array(z.string()).optional(),
    instructions: z.string(),
  })
  .strict();

export type CodeLabConfig = z.infer<typeof codeLabConfigSchema>;
export type InteractiveCalculatorConfig = z.infer<typeof interactiveCalculatorConfigSchema>;
export type InteractiveChartConfig = z.infer<typeof interactiveChartConfigSchema>;
export type InteractiveTimelineConfig = z.infer<typeof interactiveTimelineConfigSchema>;
export type InteractiveMapConfig = z.infer<typeof interactiveMapConfigSchema>;
export type InteractivePianoConfig = z.infer<typeof interactivePianoConfigSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATES: Record<string, LabTemplate<any>> = {
  "code-lab": {
    id: "code-lab",
    name: "Code Lab",
    description: "Interactive code editor with optional test runner (Sandpack-based)",
    domains: ["programming", "tech", "devops"],
    type: "INTERACTIVE",
    configSchema: codeLabConfigSchema,
    component: () => import("@/components/labs/templates/CodeLab"),
    version: 1,
  },
  "interactive-calculator": {
    id: "interactive-calculator",
    name: "Interactive Calculator",
    description: "Slider-based calculator for formula-driven domains",
    domains: ["math", "finance", "statistics", "physics"],
    type: "INTERACTIVE",
    configSchema: interactiveCalculatorConfigSchema,
    component: () => import("@/components/labs/templates/InteractiveCalculator"),
    version: 1,
  },
  "interactive-chart": {
    id: "interactive-chart",
    name: "Interactive Chart",
    description: "Manipulable chart for data-driven domains",
    domains: ["statistics", "science", "economics", "data"],
    type: "INTERACTIVE",
    configSchema: interactiveChartConfigSchema,
    component: () => import("@/components/labs/templates/InteractiveChart"),
    version: 1,
  },
  "interactive-timeline": {
    id: "interactive-timeline",
    name: "Interactive Timeline",
    description: "Chronological explorer for history, biography, processes",
    domains: ["history", "biography", "process"],
    type: "INTERACTIVE",
    configSchema: interactiveTimelineConfigSchema,
    component: () => import("@/components/labs/templates/InteractiveTimeline"),
    version: 1,
  },
  "interactive-map": {
    id: "interactive-map",
    name: "Interactive Map",
    description: "Geographic interactive map with markers and descriptions",
    domains: ["geography", "history", "language", "culture"],
    type: "INTERACTIVE",
    configSchema: interactiveMapConfigSchema,
    component: () => import("@/components/labs/templates/InteractiveMap"),
    version: 1,
  },
  "interactive-piano": {
    id: "interactive-piano",
    name: "Interactive Piano",
    description: "Virtual keyboard for music theory, ear training, scales",
    domains: ["music", "theory"],
    type: "INTERACTIVE",
    configSchema: interactivePianoConfigSchema,
    component: () => import("@/components/labs/templates/InteractivePiano"),
    version: 1,
  },
};

export function getTemplate(id: string): LabTemplate | null {
  return TEMPLATES[id] ?? null;
}

export function listTemplates(): LabTemplate[] {
  return Object.values(TEMPLATES);
}
