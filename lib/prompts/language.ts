// Locale → display name used by LLM prompts. Keeps the `langInstruction`
// out of the cacheable system prefix so cache hits survive across
// courses generated in different languages.
export const LANGUAGE_NAMES: Record<string, string> = {
  pt: "Brazilian Portuguese (pt-BR)",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  zh: "Simplified Chinese",
  ja: "Japanese",
};

export function resolveLanguageName(language: string): string {
  return LANGUAGE_NAMES[language] ?? language;
}

export function buildLanguageInstruction(language: string): string {
  const name = resolveLanguageName(language);
  return (
    `IMPORTANT: Generate ALL content in ${name}. ` +
    `This includes course/module/lesson titles, all body content, ` +
    `and all quiz questions, options, and explanations.`
  );
}

// Tavily research queries must also follow the course language,
// otherwise the model receives sources in the wrong language.
export function buildResearchQuery(topic: string, language: string): string {
  switch (language) {
    case "pt":
      return `${topic} tutorial curso aprender`;
    case "es":
      return `${topic} tutorial curso aprender`;
    case "fr":
      return `${topic} tutoriel cours apprendre`;
    case "de":
      return `${topic} tutorial kurs lernen`;
    case "it":
      return `${topic} tutorial corso imparare`;
    default:
      return `${topic} tutorial course learn`;
  }
}
