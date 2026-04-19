const TOPIC_CATEGORY_MAP: Record<string, string> = {
  // tech (EN)
  python: "tech", kali: "tech", "kali-linux": "tech", rust: "tech", sql: "tech",
  ml: "tech", "machine-learning": "tech", react: "tech", javascript: "tech",
  typescript: "tech", nodejs: "tech", "node-js": "tech", linux: "tech",
  docker: "tech", kubernetes: "tech", git: "tech", security: "tech",
  cybersecurity: "tech", "web-dev": "tech", "web-development": "tech",
  css: "tech", html: "tech", java: "tech", go: "tech", golang: "tech",
  // tech (PT)
  "desenvolvimento-web": "tech", "seguranca": "tech", "ciberseguranca": "tech",
  // lang (EN)
  english: "lang", japanese: "lang", spanish: "lang", french: "lang",
  mandarin: "lang", portuguese: "lang", german: "lang", italian: "lang",
  korean: "lang", arabic: "lang", "en-convo": "lang",
  // lang (PT)
  ingles: "lang", japones: "lang", espanhol: "lang", frances: "lang",
  mandarim: "lang", portugues: "lang", alemao: "lang", italiano: "lang",
  coreano: "lang", arabe: "lang",
  // music (EN)
  guitar: "music", piano: "music", "music-theory": "music", producing: "music",
  drums: "music", singing: "music", violin: "music", bass: "music",
  // music (PT)
  violao: "music", guitarra: "music", "teoria-musical": "music",
  "producao-musical": "music", bateria: "music", canto: "music", violino: "music",
  // craft (EN)
  bread: "craft", cooking: "craft", knife: "craft", pasta: "craft",
  joinery: "craft", coffee: "craft", woodworking: "craft", baking: "craft",
  // craft (PT)
  "pao-artesanal": "craft", "tecnica-facas": "craft", "massa-fresca": "craft",
  "marcenaria-japonesa": "craft", "cafe-especial": "craft", culinaria: "craft",
  marcenaria: "craft", panificacao: "craft",
  // science (EN)
  stats: "science", statistics: "science", linear: "science", math: "science",
  astro: "science", astronomy: "science", bio: "science", biology: "science",
  physics: "science", chemistry: "science", "bayesian-stats": "science",
  // science (PT)
  "estatistica-bayesiana": "science", "algebra-linear": "science",
  astronomia: "science", "biologia-celular": "science", fisica: "science",
  quimica: "science", matematica: "science", estatistica: "science",
  // life (EN)
  negotiation: "life", chess: "life", drawing: "life", writing: "life",
  meditation: "life", typography: "life", finance: "life", business: "life",
  productivity: "life", design: "life",
  // life (PT)
  negociacao: "life", xadrez: "life", desenho: "life", "escrita-criativa": "life",
  meditacao: "life", tipografia: "life", financas: "life", negocios: "life",
  produtividade: "life", escrita: "life",
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
