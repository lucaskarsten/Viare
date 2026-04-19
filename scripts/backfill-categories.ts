import { PrismaClient } from "@prisma/client";
import { topicToCategory } from "../lib/catalog";

const CATEGORY_MAP: Record<string, "TECH" | "LANG" | "MUSIC" | "CRAFT" | "SCIENCE" | "LIFE"> = {
  tech: "TECH", lang: "LANG", music: "MUSIC", craft: "CRAFT", science: "SCIENCE", life: "LIFE",
};

const db = new PrismaClient();

async function main() {
  const courses = await db.course.findMany({ select: { id: true, topic: true } });
  let updated = 0;

  for (const course of courses) {
    const cat = topicToCategory(course.topic);
    const category = CATEGORY_MAP[cat] ?? "TECH";
    await db.course.update({ where: { id: course.id }, data: { category } });
    updated++;
    console.log(`  ${course.topic} → ${category}`);
  }

  console.log(`\nBackfill completo: ${updated} cursos atualizados.`);
}

main().catch(console.error).finally(() => db.$disconnect());
