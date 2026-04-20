import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Difficulty } from "@prisma/client";

export const STARTING_XP = 100;

export type LabHint = { cost: number; text: string | null };

type CtfLabData = {
  type: "CTF";
  id: string;
  title: string;
  description: string;
  scenario: string;
  objectives: string[];
  difficulty: Difficulty;
  hints: LabHint[];
  revealedHintIndexes: number[];
};

type InteractiveLabData = {
  type: "INTERACTIVE";
  id: string;
  title: string;
  description: string;
  scenario: string;
  objectives: string[];
  difficulty: Difficulty;
  templateId: string;
  templateVersion: number;
  config: Record<string, unknown>;
  hints: LabHint[];
  revealedHintIndexes: number[];
};

export type LabData = CtfLabData | InteractiveLabData;

export async function getLabForUser(labId: string, userId: string): Promise<LabData | null> {
  const lab = await db.lab.findUnique({
    where: { id: labId },
    select: {
      id: true,
      title: true,
      description: true,
      scenario: true,
      objectives: true,
      difficulty: true,
      type: true,
      templateId: true,
      templateVersion: true,
      config: true,
      hints: true,
      hintReveals: {
        where: { userId },
        select: { hintIndex: true },
      },
    },
  });

  if (!lab) return null;

  const revealedIndexes = lab.hintReveals.map((r) => r.hintIndex);
  const rawHints = lab.hints as { text: string; cost: number }[];
  const maskedHints: LabHint[] = rawHints.map((h, idx) => ({
    cost: h.cost,
    text: revealedIndexes.includes(idx) ? h.text : null,
  }));

  const shared = {
    id: lab.id,
    title: lab.title,
    description: lab.description,
    scenario: lab.scenario,
    objectives: lab.objectives as string[],
    difficulty: lab.difficulty,
    hints: maskedHints,
    revealedHintIndexes: revealedIndexes,
  };

  if (lab.type === "INTERACTIVE") {
    return {
      ...shared,
      type: "INTERACTIVE",
      templateId: lab.templateId ?? "",
      templateVersion: lab.templateVersion ?? 1,
      config: (lab.config as Record<string, unknown>) ?? {},
    };
  }

  return { ...shared, type: "CTF" };
}

// RULE: LAB-01 — flagHash never to client. RULE: LAB-04 — null flagHash = INTERACTIVE lab, no flag to validate.
export async function validateFlag(submitted: string, flagHash: string | null): Promise<boolean> {
  if (!flagHash) return false;
  return bcrypt.compare(submitted.trim(), flagHash);
}
