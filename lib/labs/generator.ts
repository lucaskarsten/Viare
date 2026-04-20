import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { generateCtfLab } from "@/lib/prompts/specs/lab-ctf";
import { generateInteractiveLab } from "@/lib/prompts/specs/lab-interactive";
import { classifyGeneratedContent } from "@/lib/content-safety";
import { getTemplate } from "@/lib/labs/templates/registry";

type GenerateLabCtx = {
  language: "pt" | "en";
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonId: string;
  domainHint: string;
  labVariant: "CTF" | "INTERACTIVE";
};

function buildSafetyText(
  scenario: string,
  objectives: string[],
  hints: { text: string }[]
): string {
  return [scenario, ...objectives, ...hints.map((h) => h.text)].join(" ");
}

export async function generateAndSaveLab(
  ctx: GenerateLabCtx
): Promise<{ labId: string; labType: "CTF" | "INTERACTIVE" }> {
  if (ctx.labVariant === "CTF") {
    const output = await generateCtfLab(ctx);

    // RULE: CONTENT-02 — classifyGeneratedContent gate before persist
    const safety = classifyGeneratedContent(
      buildSafetyText(output.scenario, output.objectives, output.hints)
    );
    if (safety.verdict === "blocked") {
      throw new Error(
        `[LAB_CHECK_VIOLATION] CTF lab content blocked for lessonId="${ctx.lessonId}"`
      );
    }

    // RULE: LAB-01 — flagHash stored, never returned
    const flagHash = await bcrypt.hash(output.flag, 10);

    // RULE: LAB-05 — CHECK constraint enforces CTF requires flagHash, INTERACTIVE forbids it
    const lab = await db.lab.create({
      data: {
        lessonId: ctx.lessonId,
        type: "CTF",
        title: output.title,
        description: output.description,
        scenario: output.scenario,
        objectives: output.objectives,
        hints: output.hints,
        flagHash,
        difficulty: "MEDIUM",
      },
      select: { id: true },
    });

    console.info(
      "[LAB_GENERATED]",
      JSON.stringify({
        labId: lab.id,
        type: "CTF",
        templateId: null,
        lessonId: ctx.lessonId,
        language: ctx.language,
      })
    );

    return { labId: lab.id, labType: "CTF" };
  }

  // INTERACTIVE branch
  const output = await generateInteractiveLab(ctx);

  // RULE: CONTENT-02 — classifyGeneratedContent gate before persist
  const safety = classifyGeneratedContent(
    buildSafetyText(output.scenario, output.objectives, output.hints)
  );
  if (safety.verdict === "blocked") {
    throw new Error(
      `[LAB_CHECK_VIOLATION] INTERACTIVE lab content blocked for lessonId="${ctx.lessonId}"`
    );
  }

  const template = getTemplate(output.templateId);
  const templateVersion = template?.version ?? 1;

  // RULE: LAB-05 — CHECK constraint enforces CTF requires flagHash, INTERACTIVE forbids it
  const lab = await db.lab.create({
    data: {
      lessonId: ctx.lessonId,
      type: "INTERACTIVE",
      title: output.title,
      description: output.description,
      scenario: output.scenario,
      objectives: output.objectives,
      hints: output.hints,
      flagHash: null,
      templateId: output.templateId,
      templateVersion,
      config: output.config as Parameters<typeof db.lab.create>[0]["data"]["config"],
      difficulty: "MEDIUM",
    },
    select: { id: true },
  });

  console.info(
    "[LAB_GENERATED]",
    JSON.stringify({
      labId: lab.id,
      type: "INTERACTIVE",
      templateId: output.templateId,
      lessonId: ctx.lessonId,
      language: ctx.language,
    })
  );

  return { labId: lab.id, labType: "INTERACTIVE" };
}
