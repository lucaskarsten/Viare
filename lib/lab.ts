import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Difficulty } from "@prisma/client";

export const STARTING_XP = 100;

export type LabHint = { cost: number; text: string | null };

export type LabData = {
  id: string;
  title: string;
  description: string;
  scenario: string;
  objectives: string[];
  difficulty: Difficulty;
  hints: LabHint[];
  revealedHintIndexes: number[];
};

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

  return {
    id: lab.id,
    title: lab.title,
    description: lab.description,
    scenario: lab.scenario,
    objectives: lab.objectives as string[],
    difficulty: lab.difficulty,
    hints: rawHints.map((h, idx) => ({
      cost: h.cost,
      text: revealedIndexes.includes(idx) ? h.text : null,
    })),
    revealedHintIndexes: revealedIndexes,
  };
}

export async function validateFlag(submitted: string, flagHash: string): Promise<boolean> {
  return bcrypt.compare(submitted.trim(), flagHash);
}
