import { config } from "dotenv";
config({ path: ".env.local" });
import {
  PrismaClient,
  Difficulty,
  CourseSource,
  CourseStatus,
  CourseCategory,
  LessonType,
  EnrollmentStatus,
  ProgressStatus,
  Role,
} from "@prisma/client";
import { LESSON_CONTENT } from "./lesson-content";
import { QUIZ_QUESTIONS } from "./quiz-questions";

const db = new PrismaClient();

const DEV_USER_ID = "dev-preview-user";

type SeedCourse = {
  slug: string;
  title: string;
  description: string;
  topic: string;
  tags: string[];
  category: CourseCategory;
  difficulty: Difficulty;
  estimatedHours: number;
  totalEnrollments: number;
  avgRating: number;
  totalRatings: number;
};

// Copy e metadados alinhados com o protótipo.
const COURSES: SeedCourse[] = [
  // ── Tech (6) ─────────────────────────────────────────────────────────────
  {
    slug: "python-fundamentos",
    title: "Python, from zero",
    description: "De variáveis a web scrapers em 22 aulas. Sem código prévio.",
    topic: "python",
    tags: ["python", "programação", "iniciante"],
    category: CourseCategory.TECH,
    difficulty: Difficulty.EASY,
    estimatedHours: 18,
    totalEnrollments: 291_000,
    avgRating: 4.7,
    totalRatings: 4231,
  },
  {
    slug: "kali-linux-essencial",
    title: "Kali Linux",
    description: "Segurança ofensiva, do primeiro boot ao laboratório completo.",
    topic: "kali-linux",
    tags: ["kali", "segurança", "linux", "pentest"],
    category: CourseCategory.TECH,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 30,
    totalEnrollments: 3214,
    avgRating: 4.8,
    totalRatings: 1248,
  },
  {
    slug: "rust-systems",
    title: "Rust ownership",
    description:
      "Borrow checker, lifetimes e por que você nunca mais vai temer um segfault.",
    topic: "rust",
    tags: ["rust", "sistemas", "performance"],
    category: CourseCategory.TECH,
    difficulty: Difficulty.HARD,
    estimatedHours: 40,
    totalEnrollments: 22_140,
    avgRating: 4.9,
    totalRatings: 1102,
  },
  {
    slug: "sql-completo",
    title: "SQL, a fundo",
    description:
      "De SELECT básico a window functions e CTEs. PostgreSQL em datasets reais.",
    topic: "sql",
    tags: ["sql", "banco-de-dados", "postgresql"],
    category: CourseCategory.TECH,
    difficulty: Difficulty.EASY,
    estimatedHours: 15,
    totalEnrollments: 142_500,
    avgRating: 4.8,
    totalRatings: 3104,
  },
  {
    slug: "machine-learning-pratico",
    title: "Machine learning (intuição)",
    description:
      "Regressão, classificação e redes neurais. Do dataset ao deploy, sem teoria pesada.",
    topic: "machine-learning",
    tags: ["ml", "python", "ia", "dados"],
    category: CourseCategory.TECH,
    difficulty: Difficulty.HARD,
    estimatedHours: 50,
    totalEnrollments: 98_430,
    avgRating: 4.8,
    totalRatings: 4892,
  },
  {
    slug: "react-moderno",
    title: "React moderno",
    description:
      "Hooks, Server Components e o jeito de escrever React hoje. Com TypeScript.",
    topic: "react",
    tags: ["react", "frontend", "typescript"],
    category: CourseCategory.TECH,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 25,
    totalEnrollments: 178_200,
    avgRating: 4.7,
    totalRatings: 3847,
  },

  // ── Línguas (5) ──────────────────────────────────────────────────────────
  {
    slug: "ingles-conversacional",
    title: "Inglês conversacional",
    description: "Fluência no dia a dia com shadowing e repetição espaçada.",
    topic: "ingles",
    tags: ["inglês", "conversação", "fluência"],
    category: CourseCategory.LANG,
    difficulty: Difficulty.EASY,
    estimatedHours: 30,
    totalEnrollments: 221_000,
    avgRating: 4.6,
    totalRatings: 8921,
  },
  {
    slug: "japones-basico",
    title: "Japonês, do kana ao N4",
    description: "Hiragana, katakana, kanji essenciais e gramática básica.",
    topic: "japones",
    tags: ["japonês", "jlpt"],
    category: CourseCategory.LANG,
    difficulty: Difficulty.HARD,
    estimatedHours: 60,
    totalEnrollments: 6234,
    avgRating: 4.7,
    totalRatings: 1203,
  },
  {
    slug: "espanhol-rapido",
    title: "Espanhol para quem fala português",
    description: "Aproveita as similaridades e vai direto ao ponto.",
    topic: "espanhol",
    tags: ["espanhol", "conversação"],
    category: CourseCategory.LANG,
    difficulty: Difficulty.EASY,
    estimatedHours: 20,
    totalEnrollments: 74_120,
    avgRating: 4.8,
    totalRatings: 5432,
  },
  {
    slug: "frances-essencial",
    title: "Francês essencial",
    description: "A2 com foco em compreensão oral e escrita.",
    topic: "frances",
    tags: ["francês", "delf"],
    category: CourseCategory.LANG,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 25,
    totalEnrollments: 7213,
    avgRating: 4.6,
    totalRatings: 2103,
  },
  {
    slug: "mandarin-iniciante",
    title: "Mandarim, primeiros passos",
    description: "Tons, pinyin e caracteres básicos para sobreviver em mandarim.",
    topic: "mandarin",
    tags: ["mandarim", "chinês", "hsk"],
    category: CourseCategory.LANG,
    difficulty: Difficulty.HARD,
    estimatedHours: 70,
    totalEnrollments: 5012,
    avgRating: 4.5,
    totalRatings: 892,
  },

  // ── Música (4) ───────────────────────────────────────────────────────────
  {
    slug: "piano-classico",
    title: "Piano clássico",
    description: "Leitura, escalas e suas três primeiras peças.",
    topic: "piano",
    tags: ["piano", "música-clássica"],
    category: CourseCategory.MUSIC,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 40,
    totalEnrollments: 7821,
    avgRating: 4.6,
    totalRatings: 324,
  },
  {
    slug: "violao-popular",
    title: "Violão popular",
    description: "Acordes, ritmos e cifras para tocar MPB, pop e bossa nova.",
    topic: "violao",
    tags: ["violão", "mpb", "acordes"],
    category: CourseCategory.MUSIC,
    difficulty: Difficulty.EASY,
    estimatedHours: 20,
    totalEnrollments: 68_210,
    avgRating: 4.7,
    totalRatings: 7234,
  },
  {
    slug: "teoria-musical",
    title: "Teoria musical",
    description: "Escalas, modos, intervalos e harmonia — a linguagem por trás de qualquer estilo.",
    topic: "teoria-musical",
    tags: ["teoria", "harmonia", "solfejo"],
    category: CourseCategory.MUSIC,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 15,
    totalEnrollments: 1102,
    avgRating: 4.8,
    totalRatings: 1023,
  },
  {
    slug: "producao-musical",
    title: "Produção musical digital",
    description: "Síntese, mix e master. Produz suas próprias faixas com qualidade de release.",
    topic: "producao-musical",
    tags: ["daw", "mixing", "mastering"],
    category: CourseCategory.MUSIC,
    difficulty: Difficulty.HARD,
    estimatedHours: 35,
    totalEnrollments: 8921,
    avgRating: 4.7,
    totalRatings: 2401,
  },

  // ── Cozinha & ofícios (5) ────────────────────────────────────────────────
  {
    slug: "pao-artesanal",
    title: "Pão & fermentação natural",
    description: "Do fermento à laminação, tempo e crosta.",
    topic: "pao-artesanal",
    tags: ["pão", "fermentação", "levain"],
    category: CourseCategory.CRAFT,
    difficulty: Difficulty.EASY,
    estimatedHours: 8,
    totalEnrollments: 15_430,
    avgRating: 4.9,
    totalRatings: 2103,
  },
  {
    slug: "tecnica-facas",
    title: "Técnica de facas",
    description: "Julienne, brunoise, chiffonade e afiação de verdade.",
    topic: "tecnica-facas",
    tags: ["facas", "cortes"],
    category: CourseCategory.CRAFT,
    difficulty: Difficulty.EASY,
    estimatedHours: 5,
    totalEnrollments: 987,
    avgRating: 4.8,
    totalRatings: 287,
  },
  {
    slug: "massa-fresca",
    title: "Massa fresca italiana",
    description: "Sfoglia, tagliatelle, ravióli e gnocchi com farinha 00.",
    topic: "massa-fresca",
    tags: ["massa", "italiana", "pasta"],
    category: CourseCategory.CRAFT,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 10,
    totalEnrollments: 1876,
    avgRating: 4.9,
    totalRatings: 534,
  },
  {
    slug: "marcenaria-japonesa",
    title: "Marcenaria japonesa",
    description: "Encaixes sem pregos, plaina japonesa e acabamento wabi-sabi.",
    topic: "marcenaria-japonesa",
    tags: ["marcenaria", "japonesa", "madeira"],
    category: CourseCategory.CRAFT,
    difficulty: Difficulty.HARD,
    estimatedHours: 30,
    totalEnrollments: 743,
    avgRating: 4.9,
    totalRatings: 421,
  },
  {
    slug: "cafe-especial",
    title: "Café especial",
    description: "Torra, moagem e extração: espresso, V60, aeropress, cold brew.",
    topic: "cafe-especial",
    tags: ["café", "barista", "extração"],
    category: CourseCategory.CRAFT,
    difficulty: Difficulty.EASY,
    estimatedHours: 6,
    totalEnrollments: 3876,
    avgRating: 4.7,
    totalRatings: 1004,
  },

  // ── Ciências (4) ─────────────────────────────────────────────────────────
  {
    slug: "estatistica-bayesiana",
    title: "Estatística bayesiana, com intuição",
    description: "Prioris, atualizações e a gramática da crença.",
    topic: "estatistica-bayesiana",
    tags: ["estatística", "bayesiana", "pymc"],
    category: CourseCategory.SCIENCE,
    difficulty: Difficulty.HARD,
    estimatedHours: 40,
    totalEnrollments: 1234,
    avgRating: 4.8,
    totalRatings: 621,
  },
  {
    slug: "algebra-linear",
    title: "Álgebra linear aplicada",
    description: "Vetores, SVD, PCA — base para ML e computação gráfica.",
    topic: "algebra-linear",
    tags: ["matemática", "álgebra-linear", "numpy"],
    category: CourseCategory.SCIENCE,
    difficulty: Difficulty.HARD,
    estimatedHours: 35,
    totalEnrollments: 2103,
    avgRating: 4.7,
    totalRatings: 1023,
  },
  {
    slug: "astronomia-pratica",
    title: "Astronomia prática",
    description: "Constelações, telescópio, astrofotografia básica.",
    topic: "astronomia",
    tags: ["astronomia", "telescópio"],
    category: CourseCategory.SCIENCE,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 20,
    totalEnrollments: 2876,
    avgRating: 4.8,
    totalRatings: 1234,
  },
  {
    slug: "biologia-celular",
    title: "Biologia celular",
    description: "Organelas, mitose, meiose e sinalização — base para medicina e biotec.",
    topic: "biologia-celular",
    tags: ["biologia", "célula", "genética"],
    category: CourseCategory.SCIENCE,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 25,
    totalEnrollments: 2012,
    avgRating: 4.6,
    totalRatings: 743,
  },

  // ── Vida (6) ─────────────────────────────────────────────────────────────
  {
    slug: "negociacao",
    title: "Negociação",
    description:
      "BATNA, ancoragem e aprender a parar de falar. Conversas difíceis com mais sangue frio.",
    topic: "negociacao",
    tags: ["negociação", "comunicação", "carreira"],
    category: CourseCategory.LIFE,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 10,
    totalEnrollments: 11_203,
    avgRating: 4.7,
    totalRatings: 512,
  },
  {
    slug: "xadrez-estrategia",
    title: "Xadrez estratégico",
    description: "Aberturas, finais e padrões táticos — do iniciante ao ELO 1400.",
    topic: "xadrez",
    tags: ["xadrez", "estratégia"],
    category: CourseCategory.LIFE,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 15,
    totalEnrollments: 19_034,
    avgRating: 4.7,
    totalRatings: 2103,
  },
  {
    slug: "desenho-iniciante",
    title: "Desenho para iniciantes",
    description: "Ver para desenhar: proporção, perspectiva, luz e sombra.",
    topic: "desenho",
    tags: ["desenho", "arte"],
    category: CourseCategory.LIFE,
    difficulty: Difficulty.EASY,
    estimatedHours: 12,
    totalEnrollments: 17_230,
    avgRating: 4.7,
    totalRatings: 2543,
  },
  {
    slug: "escrita-criativa",
    title: "Escrita criativa",
    description:
      "Personagens, conflito e voz narrativa. Ficção que dá vontade de terminar de ler.",
    topic: "escrita-criativa",
    tags: ["escrita", "ficção", "narrativa"],
    category: CourseCategory.LIFE,
    difficulty: Difficulty.EASY,
    estimatedHours: 10,
    totalEnrollments: 3421,
    avgRating: 4.6,
    totalRatings: 1478,
  },
  {
    slug: "meditacao-mindfulness",
    title: "Meditação e mindfulness",
    description: "Atenção plena, body scan e respiração — práticas MBSR.",
    topic: "meditacao",
    tags: ["meditação", "mindfulness"],
    category: CourseCategory.LIFE,
    difficulty: Difficulty.EASY,
    estimatedHours: 8,
    totalEnrollments: 45_210,
    avgRating: 4.5,
    totalRatings: 3012,
  },
  {
    slug: "tipografia-design",
    title: "Tipografia e design",
    description: "Anatomia das letras, hierarquia e composição — comunicar melhor.",
    topic: "tipografia",
    tags: ["tipografia", "design"],
    category: CourseCategory.LIFE,
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 12,
    totalEnrollments: 4321,
    avgRating: 4.8,
    totalRatings: 623,
  },
];

// ── Lesson structures (apenas para cursos com enrollment ativo) ────────────

type LessonSeed = { slug: string; title: string; type: LessonType; order: number };
type ModuleSeed = { slug: string; title: string; order: number; lessons: LessonSeed[] };

const KALI_MODULES: ModuleSeed[] = [
  {
    slug: "foundations",
    title: "Foundations",
    order: 0,
    lessons: [
      { slug: "what-kali-actually-is", title: "What Kali actually is", type: LessonType.THEORY, order: 0 },
      { slug: "install-and-first-boot", title: "Install & first boot", type: LessonType.LAB, order: 1 },
      { slug: "filesystem-layout", title: "Filesystem layout", type: LessonType.THEORY, order: 2 },
      { slug: "update-streams", title: "Update streams", type: LessonType.QUIZ, order: 3 },
    ],
  },
  {
    slug: "network-recon",
    title: "Network reconnaissance",
    order: 1,
    lessons: [
      { slug: "nmap-basics", title: "Nmap basics", type: LessonType.THEORY, order: 0 },
      { slug: "network-recon-nmap", title: "Network reconnaissance with nmap", type: LessonType.LAB, order: 1 },
      { slug: "service-enumeration", title: "Service enumeration", type: LessonType.THEORY, order: 2 },
      { slug: "tracing-routes", title: "Tracing routes", type: LessonType.LAB, order: 3 },
    ],
  },
  {
    slug: "vuln-assessment",
    title: "Vulnerability assessment",
    order: 2,
    lessons: [
      { slug: "nessus-openvas", title: "Nessus & OpenVAS", type: LessonType.THEORY, order: 0 },
      { slug: "web-scanning", title: "Web application scanning", type: LessonType.LAB, order: 1 },
      { slug: "false-positives", title: "Reading results without crying", type: LessonType.QUIZ, order: 2 },
    ],
  },
  {
    slug: "exploitation",
    title: "Exploitation",
    order: 3,
    lessons: [
      { slug: "metasploit-intro", title: "Metasploit basics", type: LessonType.THEORY, order: 0 },
      { slug: "payloads-vs-exploits", title: "Payloads vs exploits", type: LessonType.QUIZ, order: 1 },
      { slug: "initial-access", title: "Getting initial access", type: LessonType.LAB, order: 2 },
      { slug: "privilege-escalation", title: "Privilege escalation", type: LessonType.LAB, order: 3 },
    ],
  },
  {
    slug: "post-exploitation",
    title: "Post-exploitation",
    order: 4,
    lessons: [
      { slug: "persistence", title: "Persistence mechanisms", type: LessonType.THEORY, order: 0 },
      { slug: "pivoting", title: "Pivoting through the network", type: LessonType.LAB, order: 1 },
      { slug: "reporting", title: "Writing the report", type: LessonType.PROJECT, order: 2 },
    ],
  },
];

const PAO_MODULES: ModuleSeed[] = [
  {
    slug: "fundamentos",
    title: "Fundamentos",
    order: 0,
    lessons: [
      { slug: "farinha-agua-sal", title: "Farinha, água, sal", type: LessonType.THEORY, order: 0 },
      { slug: "hidratacao", title: "Hidratação como orçamento", type: LessonType.THEORY, order: 1 },
      { slug: "temperatura-ambiente", title: "Temperatura e tempo", type: LessonType.THEORY, order: 2 },
    ],
  },
  {
    slug: "levain",
    title: "Levain",
    order: 1,
    lessons: [
      { slug: "criar-levain", title: "Criar e manter levain", type: LessonType.LAB, order: 0 },
      { slug: "leitura-do-levain", title: "Ler o levain", type: LessonType.THEORY, order: 1 },
      { slug: "refrescos", title: "Refrescos que funcionam", type: LessonType.QUIZ, order: 2 },
    ],
  },
  {
    slug: "massa",
    title: "Massa e dobras",
    order: 2,
    lessons: [
      { slug: "autolise", title: "Autólise", type: LessonType.THEORY, order: 0 },
      { slug: "dobras", title: "Dobras de força", type: LessonType.LAB, order: 1 },
      { slug: "fermentacao-em-bloco", title: "Fermentação em bloco", type: LessonType.LAB, order: 2 },
    ],
  },
  {
    slug: "forno",
    title: "Forno e acabamento",
    order: 3,
    lessons: [
      { slug: "modelagem", title: "Modelagem", type: LessonType.LAB, order: 0 },
      { slug: "cortes-e-assamento", title: "Cortes e assamento", type: LessonType.LAB, order: 1 },
      { slug: "cascas-miolo", title: "Casca e miolo", type: LessonType.PROJECT, order: 2 },
    ],
  },
];

const PIANO_MODULES: ModuleSeed[] = [
  {
    slug: "postura",
    title: "Postura e leitura",
    order: 0,
    lessons: [
      { slug: "postura-das-maos", title: "Postura das mãos", type: LessonType.THEORY, order: 0 },
      { slug: "leitura-do-pentagrama", title: "Leitura do pentagrama", type: LessonType.THEORY, order: 1 },
      { slug: "claves-fa-sol", title: "Claves de fá e sol", type: LessonType.QUIZ, order: 2 },
      { slug: "dedilhado-inicial", title: "Dedilhado inicial", type: LessonType.LAB, order: 3 },
      { slug: "ritmo-basico", title: "Ritmo básico", type: LessonType.THEORY, order: 4 },
      { slug: "primeiro-exercicio", title: "Primeiro exercício completo", type: LessonType.LAB, order: 5 },
    ],
  },
  {
    slug: "tecnicas",
    title: "Técnicas de dedilhado",
    order: 1,
    lessons: [
      { slug: "escalas-maiores", title: "Escalas maiores", type: LessonType.LAB, order: 0 },
      { slug: "escalas-menores", title: "Escalas menores", type: LessonType.LAB, order: 1 },
      { slug: "arpejos", title: "Arpejos básicos", type: LessonType.LAB, order: 2 },
      { slug: "passagem-de-polegar", title: "Passagem de polegar", type: LessonType.THEORY, order: 3 },
      { slug: "legato-staccato", title: "Legato e staccato", type: LessonType.LAB, order: 4 },
      { slug: "exercicios-hanon", title: "Exercícios Hanon", type: LessonType.LAB, order: 5 },
    ],
  },
  {
    slug: "dinamica",
    title: "Dinâmica e interpretação",
    order: 2,
    lessons: [
      { slug: "piano-forte", title: "Piano, forte e nuances", type: LessonType.THEORY, order: 0 },
      { slug: "pedal-sustain", title: "Pedal de sustain", type: LessonType.LAB, order: 1 },
      { slug: "fraseado", title: "Fraseado musical", type: LessonType.THEORY, order: 2 },
      { slug: "rubato", title: "Rubato com controle", type: LessonType.LAB, order: 3 },
      { slug: "respiracao-musical", title: "Respiração musical", type: LessonType.QUIZ, order: 4 },
      { slug: "interpretacao-bach", title: "Interpretando Bach", type: LessonType.THEORY, order: 5 },
    ],
  },
  {
    slug: "repertorio",
    title: "Repertório básico",
    order: 3,
    lessons: [
      { slug: "minueto-bach", title: "Minueto — Bach", type: LessonType.PROJECT, order: 0 },
      { slug: "fur-elise", title: "Für Elise — Beethoven", type: LessonType.PROJECT, order: 1 },
      { slug: "prelude-chopin", title: "Prelúdio — Chopin", type: LessonType.PROJECT, order: 2 },
      { slug: "gymnopedie-satie", title: "Gymnopédie — Satie", type: LessonType.PROJECT, order: 3 },
      { slug: "nocturnes-primeiros", title: "Primeiros noturnos", type: LessonType.PROJECT, order: 4 },
      { slug: "recital-final", title: "Recital final", type: LessonType.PROJECT, order: 5 },
    ],
  },
];

const NEGOCIACAO_MODULES: ModuleSeed[] = [
  {
    slug: "fundamentos",
    title: "Fundamentos",
    order: 0,
    lessons: [
      { slug: "o-que-e-batna", title: "O que é BATNA", type: LessonType.THEORY, order: 0 },
      { slug: "zopa", title: "Zona de acordo possível (ZOPA)", type: LessonType.THEORY, order: 1 },
      { slug: "escuta-ativa", title: "Escuta ativa", type: LessonType.LAB, order: 2 },
    ],
  },
  {
    slug: "taticas",
    title: "Táticas",
    order: 1,
    lessons: [
      { slug: "ancoragem", title: "Ancoragem", type: LessonType.THEORY, order: 0 },
      { slug: "silencio", title: "O poder do silêncio", type: LessonType.LAB, order: 1 },
      { slug: "quadros-de-referencia", title: "Quadros de referência", type: LessonType.THEORY, order: 2 },
      { slug: "lidando-com-pressao", title: "Lidando com pressão", type: LessonType.LAB, order: 3 },
    ],
  },
  {
    slug: "fechamento",
    title: "Fechamento",
    order: 2,
    lessons: [
      { slug: "fechar-sem-afobar", title: "Fechar sem afobar", type: LessonType.LAB, order: 0 },
      { slug: "acordo-vs-ganhar", title: "Acordo vs. ganhar", type: LessonType.THEORY, order: 1 },
      { slug: "simulacao-final", title: "Simulação final", type: LessonType.PROJECT, order: 2 },
    ],
  },
];

const LESSON_STRUCTURES: Record<string, ModuleSeed[]> = {
  "kali-linux-essencial": KALI_MODULES,
  "pao-artesanal": PAO_MODULES,
  "piano-classico": PIANO_MODULES,
  negociacao: NEGOCIACAO_MODULES,
};

// ── Dev user progress plan ─────────────────────────────────────────────────

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// Cada entrada: qual aula, quantos dias atrás foi concluída.
// Current week (Mon Apr 13 → Sun Apr 19, 2026, today=Sun Apr 19 = day 0):
//   days 0..6 within current week.
// Meta semanal pede 4/6: exatamente 4 entries com daysAgoValue ≤ 6.
type ProgressPlan = {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  daysAgoValue: number;
};

const PROGRESS_PLAN: ProgressPlan[] = [
  // Kali: 6 completadas (3 nesta semana, 3 antes)
  { courseSlug: "kali-linux-essencial", moduleSlug: "foundations", lessonSlug: "what-kali-actually-is", daysAgoValue: 0 },   // hoje
  { courseSlug: "kali-linux-essencial", moduleSlug: "foundations", lessonSlug: "install-and-first-boot", daysAgoValue: 4 },  // quarta
  { courseSlug: "kali-linux-essencial", moduleSlug: "foundations", lessonSlug: "filesystem-layout", daysAgoValue: 6 },       // segunda
  { courseSlug: "kali-linux-essencial", moduleSlug: "foundations", lessonSlug: "update-streams", daysAgoValue: 11 },
  { courseSlug: "kali-linux-essencial", moduleSlug: "network-recon", lessonSlug: "nmap-basics", daysAgoValue: 17 },
  { courseSlug: "kali-linux-essencial", moduleSlug: "network-recon", lessonSlug: "service-enumeration", daysAgoValue: 24 },

  // Pão: 7 completadas (1 nesta semana + 6 antes)
  { courseSlug: "pao-artesanal", moduleSlug: "fundamentos", lessonSlug: "farinha-agua-sal", daysAgoValue: 2 },               // sexta
  { courseSlug: "pao-artesanal", moduleSlug: "fundamentos", lessonSlug: "hidratacao", daysAgoValue: 8 },
  { courseSlug: "pao-artesanal", moduleSlug: "fundamentos", lessonSlug: "temperatura-ambiente", daysAgoValue: 9 },
  { courseSlug: "pao-artesanal", moduleSlug: "levain", lessonSlug: "criar-levain", daysAgoValue: 14 },
  { courseSlug: "pao-artesanal", moduleSlug: "levain", lessonSlug: "leitura-do-levain", daysAgoValue: 16 },
  { courseSlug: "pao-artesanal", moduleSlug: "levain", lessonSlug: "refrescos", daysAgoValue: 21 },
  { courseSlug: "pao-artesanal", moduleSlug: "massa", lessonSlug: "autolise", daysAgoValue: 25 },

  // Piano: 4 completadas (todas antes desta semana)
  { courseSlug: "piano-classico", moduleSlug: "postura", lessonSlug: "postura-das-maos", daysAgoValue: 11 },
  { courseSlug: "piano-classico", moduleSlug: "postura", lessonSlug: "leitura-do-pentagrama", daysAgoValue: 15 },
  { courseSlug: "piano-classico", moduleSlug: "postura", lessonSlug: "claves-fa-sol", daysAgoValue: 20 },
  { courseSlug: "piano-classico", moduleSlug: "postura", lessonSlug: "dedilhado-inicial", daysAgoValue: 28 },

  // Negociação: 1 completada (antes desta semana)
  { courseSlug: "negociacao", moduleSlug: "fundamentos", lessonSlug: "o-que-e-batna", daysAgoValue: 14 },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("→ Users...");

  const admin = await db.user.upsert({
    where: { email: "admin@viare.dev" },
    update: {},
    create: { email: "admin@viare.dev", name: "Admin Viare", role: Role.ADMIN },
  });

  await db.user.upsert({
    where: { email: "student1@viare.dev" },
    update: {},
    create: { email: "student1@viare.dev", name: "Alice Hacker" },
  });

  await db.user.upsert({
    where: { email: "student2@viare.dev" },
    update: {},
    create: { email: "student2@viare.dev", name: "Bob Pentest" },
  });

  const dev = await db.user.upsert({
    where: { id: DEV_USER_ID },
    update: { name: "Lucas Karsten", email: "dev@viare.local" },
    create: {
      id: DEV_USER_ID,
      email: "dev@viare.local",
      name: "Lucas Karsten",
      role: Role.STUDENT,
    },
  });

  await db.userStreak.upsert({
    where: { userId: dev.id },
    update: {
      currentStreak: 12,
      longestStreak: 23,
      lastActiveDate: daysAgo(0),
    },
    create: {
      userId: dev.id,
      currentStreak: 12,
      longestStreak: 23,
      lastActiveDate: daysAgo(0),
    },
  });

  console.log("→ Cursos (30)...");

  for (const course of COURSES) {
    await db.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        tags: course.tags,
        category: course.category,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours,
        totalEnrollments: course.totalEnrollments,
        avgRating: course.avgRating,
        totalRatings: course.totalRatings,
        status: CourseStatus.PUBLISHED,
      },
      create: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        topic: course.topic,
        tags: course.tags,
        category: course.category,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours,
        totalEnrollments: course.totalEnrollments,
        avgRating: course.avgRating,
        totalRatings: course.totalRatings,
        status: CourseStatus.PUBLISHED,
        sourceType: CourseSource.MANUAL,
        createdById: admin.id,
      },
    });
  }

  console.log("→ Módulos e aulas para cursos ativos do dev...");

  for (const [courseSlug, modules] of Object.entries(LESSON_STRUCTURES)) {
    const course = await db.course.findUnique({ where: { slug: courseSlug } });
    if (!course) continue;

    for (const m of modules) {
      const mod = await db.module.upsert({
        where: { courseId_slug: { courseId: course.id, slug: m.slug } },
        update: { title: m.title, order: m.order },
        create: { courseId: course.id, slug: m.slug, title: m.title, order: m.order },
      });

      for (const l of m.lessons) {
        const contentKey = `${courseSlug}/${m.slug}/${l.slug}`;
        const content = LESSON_CONTENT[contentKey] ?? null;
        const lessonRow = await db.lesson.upsert({
          where: { moduleId_slug: { moduleId: mod.id, slug: l.slug } },
          update: { title: l.title, type: l.type, order: l.order, content },
          create: {
            moduleId: mod.id,
            slug: l.slug,
            title: l.title,
            type: l.type,
            order: l.order,
            content,
          },
        });

        const questions = QUIZ_QUESTIONS[contentKey];
        if (questions && questions.length > 0) {
          await db.quizQuestion.deleteMany({ where: { lessonId: lessonRow.id } });
          await db.quizQuestion.createMany({
            data: questions.map((q, i) => ({
              lessonId: lessonRow.id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              order: i,
            })),
          });
        }
      }
    }
  }

  console.log("→ Limpando progresso antigo do dev...");
  await db.userProgress.deleteMany({ where: { userId: dev.id } });
  await db.enrollment.deleteMany({ where: { userId: dev.id } });

  console.log("→ Enrollments ativos do dev (4)...");

  const enrolledCourseSlugs = ["kali-linux-essencial", "pao-artesanal", "piano-classico", "negociacao"];
  const lastAccessedMap: Record<string, number> = {
    "kali-linux-essencial": 0,   // hoje
    "pao-artesanal": 2,          // 2 dias atrás
    "piano-classico": 11,        // semana passada
    negociacao: 14,              // ~2 semanas atrás
  };

  const enrollmentByCourse: Record<string, string> = {};

  for (const slug of enrolledCourseSlugs) {
    const course = await db.course.findUnique({
      where: { slug },
      include: { modules: { include: { lessons: true } } },
    });
    if (!course) continue;

    const totalLessons = course.modules.flatMap((m) => m.lessons).length;
    const completedForCourse = PROGRESS_PLAN.filter((p) => p.courseSlug === slug).length;
    const progressPercent = totalLessons === 0 ? 0 : Math.round((completedForCourse / totalLessons) * 100);

    const enrollment = await db.enrollment.create({
      data: {
        userId: dev.id,
        courseId: course.id,
        status: EnrollmentStatus.IN_PROGRESS,
        progressPercent,
        lastAccessedAt: daysAgo(lastAccessedMap[slug]),
      },
    });
    enrollmentByCourse[slug] = enrollment.id;
  }

  console.log("→ UserProgress (18 completadas)...");

  for (const p of PROGRESS_PLAN) {
    const lesson = await db.lesson.findFirst({
      where: {
        slug: p.lessonSlug,
        module: { slug: p.moduleSlug, course: { slug: p.courseSlug } },
      },
    });
    if (!lesson) {
      console.warn(`  ! lesson not found: ${p.courseSlug}/${p.moduleSlug}/${p.lessonSlug}`);
      continue;
    }
    const when = daysAgo(p.daysAgoValue);
    await db.userProgress.create({
      data: {
        userId: dev.id,
        lessonId: lesson.id,
        status: ProgressStatus.COMPLETED,
        completedAt: when,
        createdAt: when,
        updatedAt: when,
      },
    });
  }

  console.log("✓ Seed concluído.");
  console.log(`  · Dev user: ${dev.name} (${dev.id})`);
  console.log(`  · Streak: 12 / record 23`);
  console.log(`  · Enrollments: ${enrolledCourseSlugs.length}`);
  console.log(`  · Lessons completed: ${PROGRESS_PLAN.length}`);
  console.log(`  · Courses: ${COURSES.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
