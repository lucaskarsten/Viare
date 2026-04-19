const TOPIC_CATEGORY_MAP: Record<string, string> = {
  // tech
  python: "tech", kali: "tech", "kali-linux": "tech", rust: "tech", sql: "tech",
  ml: "tech", "machine-learning": "tech", react: "tech", javascript: "tech",
  typescript: "tech", nodejs: "tech", "node-js": "tech", linux: "tech",
  docker: "tech", kubernetes: "tech", git: "tech", security: "tech",
  cybersecurity: "tech", "web-dev": "tech", "web-development": "tech",
  css: "tech", html: "tech", java: "tech", go: "tech", golang: "tech",
  // lang
  english: "lang", japanese: "lang", spanish: "lang", french: "lang",
  mandarin: "lang", portuguese: "lang", german: "lang", italian: "lang",
  korean: "lang", arabic: "lang", "en-convo": "lang",
  // music
  guitar: "music", piano: "music", "music-theory": "music", producing: "music",
  drums: "music", singing: "music", violin: "music", bass: "music",
  // craft
  bread: "craft", cooking: "craft", knife: "craft", pasta: "craft",
  joinery: "craft", coffee: "craft", woodworking: "craft", baking: "craft",
  // science
  stats: "science", statistics: "science", linear: "science", math: "science",
  astro: "science", astronomy: "science", bio: "science", biology: "science",
  physics: "science", chemistry: "science", "bayesian-stats": "science",
  // life
  negotiation: "life", chess: "life", drawing: "life", writing: "life",
  meditation: "life", typography: "life", finance: "life", business: "life",
  productivity: "life", design: "life",
};

export function topicToCategory(topic: string): string {
  const normalized = topic.toLowerCase().replace(/\s+/g, "-");
  return TOPIC_CATEGORY_MAP[normalized] ?? "tech";
}

const ACCENT_COLORS = [
  "#4f7cac", "#5a9e6f", "#c46b3a", "#8b5cf6",
  "#e56b6f", "#3a86a8", "#b8a06e", "#6a5a8a",
];

export function courseAccentColor(id: string): string {
  const sum = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return ACCENT_COLORS[sum % ACCENT_COLORS.length];
}

export function formatLearners(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

export function formatDuration(hours: number | null): string {
  if (!hours) return "–";
  return `~${hours}h`;
}

export function displayLetter(title: string): string {
  const words = title.split(/[\s,]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] + words[1][0]).toUpperCase();
}
