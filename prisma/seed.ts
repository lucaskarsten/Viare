import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient, Difficulty, CourseSource, CourseStatus, Role } from "@prisma/client";

const db = new PrismaClient();

const COURSES: {
  slug: string;
  title: string;
  description: string;
  topic: string;
  tags: string[];
  difficulty: Difficulty;
  estimatedHours: number;
}[] = [
  // ── Tech (6) ──────────────────────────────────────────────────────────────
  {
    slug: "python-fundamentos",
    title: "Python: Fundamentos",
    description:
      "Aprenda Python do zero: variáveis, funções, listas, dicionários e orientação a objetos. Ideal para quem quer entrar na programação ou migrar de outra linguagem.",
    topic: "python",
    tags: ["cat:Tech", "python", "programação", "iniciante"],
    difficulty: Difficulty.EASY,
    estimatedHours: 20,
  },
  {
    slug: "kali-linux-essencial",
    title: "Kali Linux Essencial",
    description:
      "Domine as ferramentas de segurança e pentest do Kali Linux: Nmap, Metasploit, Burp Suite e mais. Para quem já usa Linux e quer entrar em segurança ofensiva.",
    topic: "kali-linux",
    tags: ["cat:Tech", "kali", "segurança", "linux", "pentest"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 30,
  },
  {
    slug: "rust-systems",
    title: "Rust: Programação de Sistemas",
    description:
      "Ownership, borrowing, lifetimes e concorrência segura. Construa software de sistema de alta performance sem garbage collector e sem memory leaks.",
    topic: "rust",
    tags: ["cat:Tech", "rust", "sistemas", "performance"],
    difficulty: Difficulty.HARD,
    estimatedHours: 40,
  },
  {
    slug: "sql-completo",
    title: "SQL Completo",
    description:
      "De SELECT básico a window functions, CTEs e otimização de queries. Cobre PostgreSQL com exemplos práticos em datasets reais.",
    topic: "sql",
    tags: ["cat:Tech", "sql", "banco-de-dados", "postgresql"],
    difficulty: Difficulty.EASY,
    estimatedHours: 15,
  },
  {
    slug: "machine-learning-pratico",
    title: "Machine Learning Prático",
    description:
      "Regressão, classificação, clustering e redes neurais com scikit-learn e PyTorch. Projetos com dados reais do início ao deploy.",
    topic: "machine-learning",
    tags: ["cat:Tech", "ml", "python", "ia", "dados"],
    difficulty: Difficulty.HARD,
    estimatedHours: 50,
  },
  {
    slug: "react-moderno",
    title: "React Moderno",
    description:
      "Hooks, Context, Server Components e performance. Aprenda React do jeito atual: sem class components, com TypeScript e boas práticas de 2025.",
    topic: "react",
    tags: ["cat:Tech", "react", "frontend", "typescript", "javascript"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 25,
  },

  // ── Línguas (5) ───────────────────────────────────────────────────────────
  {
    slug: "ingles-conversacional",
    title: "Inglês Conversacional",
    description:
      "Fluência oral no dia a dia: pronúncia, expressões idiomáticas, situações reais. Método baseado em shadowing e repetição espaçada.",
    topic: "ingles",
    tags: ["cat:Línguas", "inglês", "conversação", "fluência"],
    difficulty: Difficulty.EASY,
    estimatedHours: 30,
  },
  {
    slug: "japones-basico",
    title: "Japonês Básico",
    description:
      "Hiragana, Katakana, kanji essenciais e gramática básica. Do zero ao N4 com exercícios de escrita e leitura progressivos.",
    topic: "japones",
    tags: ["cat:Línguas", "japonês", "jlpt", "escrita-japonesa"],
    difficulty: Difficulty.HARD,
    estimatedHours: 60,
  },
  {
    slug: "espanhol-rapido",
    title: "Espanhol Rápido",
    description:
      "Para falantes de português: aproveite as similaridades e vá direto ao ponto. Conversação, vocabulário e gramática essencial em tempo recorde.",
    topic: "espanhol",
    tags: ["cat:Línguas", "espanhol", "conversação"],
    difficulty: Difficulty.EASY,
    estimatedHours: 20,
  },
  {
    slug: "frances-essencial",
    title: "Francês Essencial",
    description:
      "Pronúncia, gramática e vocabulário para viagem, negócios e cultura. Nível A2 com foco em compreensão oral e escrita.",
    topic: "frances",
    tags: ["cat:Línguas", "francês", "delf"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 25,
  },
  {
    slug: "mandarin-iniciante",
    title: "Mandarim para Iniciantes",
    description:
      "Tons, pinyin, caracteres básicos e sobrevivência em Mandarin. Inclui sistema de escrita simplificado e vocabulário cotidiano.",
    topic: "mandarin",
    tags: ["cat:Línguas", "mandarim", "chinês", "hsk"],
    difficulty: Difficulty.HARD,
    estimatedHours: 70,
  },

  // ── Música (4) ────────────────────────────────────────────────────────────
  {
    slug: "piano-classico",
    title: "Piano Clássico",
    description:
      "Leitura de partitura, técnica de dedilhado, dinâmica e repertório de Bach a Chopin. Adequado para quem nunca tocou um instrumento.",
    topic: "piano",
    tags: ["cat:Música", "piano", "música-clássica", "partitura"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 40,
  },
  {
    slug: "violao-popular",
    title: "Violão Popular",
    description:
      "Acordes, ritmos e cifras para tocar seus estilos favoritos — MPB, pop, rock e bossa nova. Do posicionamento dos dedos ao solo básico.",
    topic: "violao",
    tags: ["cat:Música", "violão", "mpb", "acordes"],
    difficulty: Difficulty.EASY,
    estimatedHours: 20,
  },
  {
    slug: "teoria-musical",
    title: "Teoria Musical",
    description:
      "Escalas, modos, intervalos, harmonia e contraponto. A linguagem por trás de qualquer instrumento ou estilo musical.",
    topic: "teoria-musical",
    tags: ["cat:Música", "teoria", "harmonia", "solfejo"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 15,
  },
  {
    slug: "producao-musical",
    title: "Produção Musical Digital",
    description:
      "DAW, síntese, mixing e mastering. Produza suas próprias faixas usando Ableton ou FL Studio com qualidade de release.",
    topic: "producao-musical",
    tags: ["cat:Música", "daw", "mixing", "mastering", "beatmaking"],
    difficulty: Difficulty.HARD,
    estimatedHours: 35,
  },

  // ── Cozinha & ofícios (5) ─────────────────────────────────────────────────
  {
    slug: "pao-artesanal",
    title: "Pão Artesanal",
    description:
      "Fermentação natural (levain), hidratação, dobras e assamento em forno doméstico. Do poolish ao sourdough com casca crocante garantida.",
    topic: "pao-artesanal",
    tags: ["cat:Cozinha", "pão", "fermentação", "levain"],
    difficulty: Difficulty.EASY,
    estimatedHours: 8,
  },
  {
    slug: "tecnica-facas",
    title: "Técnica de Facas",
    description:
      "Cortes clássicos da cozinha profissional: julienne, brunoise, chiffonade. Afiação, manutenção e segurança com facas de chef.",
    topic: "tecnica-facas",
    tags: ["cat:Cozinha", "facas", "cortes", "culinária"],
    difficulty: Difficulty.EASY,
    estimatedHours: 5,
  },
  {
    slug: "massa-fresca",
    title: "Massa Fresca Italiana",
    description:
      "Sfoglia à mão e à máquina, tagliatelle, pappardelle, ravióli e gnocchi. Técnica italiana autêntica com farinha tipo 00.",
    topic: "massa-fresca",
    tags: ["cat:Cozinha", "massa", "italiana", "pasta"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 10,
  },
  {
    slug: "marcenaria-japonesa",
    title: "Marcenaria Japonesa",
    description:
      "Encaixes sem pregos (shoji, kumiko), plaina japonesa e acabamento wabi-sabi. Trabalhe madeira com precisão e filosofia.",
    topic: "marcenaria-japonesa",
    tags: ["cat:Cozinha", "marcenaria", "japonesa", "madeira", "kumiko"],
    difficulty: Difficulty.HARD,
    estimatedHours: 30,
  },
  {
    slug: "cafe-especial",
    title: "Café Especial",
    description:
      "Origem, torra, moagem e extração: espresso, pour-over, aeropress e cold brew. Entenda pontuação SCA e calibre sua dose perfeita.",
    topic: "cafe-especial",
    tags: ["cat:Cozinha", "café", "barista", "extração"],
    difficulty: Difficulty.EASY,
    estimatedHours: 6,
  },

  // ── Ciências (4) ──────────────────────────────────────────────────────────
  {
    slug: "estatistica-bayesiana",
    title: "Estatística Bayesiana",
    description:
      "Prior, likelihood, posterior e MCMC. Raciocínio probabilístico com Python (PyMC) aplicado a inferência real e tomada de decisão.",
    topic: "estatistica-bayesiana",
    tags: ["cat:Ciências", "estatística", "bayesiana", "probabilidade", "pymc"],
    difficulty: Difficulty.HARD,
    estimatedHours: 40,
  },
  {
    slug: "algebra-linear",
    title: "Álgebra Linear Aplicada",
    description:
      "Vetores, matrizes, decomposições (SVD, PCA) e transformações lineares com numpy. Base matemática para ML, computação gráfica e mais.",
    topic: "algebra-linear",
    tags: ["cat:Ciências", "matemática", "álgebra-linear", "numpy"],
    difficulty: Difficulty.HARD,
    estimatedHours: 35,
  },
  {
    slug: "astronomia-pratica",
    title: "Astronomia Prática",
    description:
      "Identificação de constelações, uso de telescópio, astrofotografia básica e mecânica celeste. Do céu a olho nu ao sistema solar.",
    topic: "astronomia",
    tags: ["cat:Ciências", "astronomia", "telescópio", "constelações"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 20,
  },
  {
    slug: "biologia-celular",
    title: "Biologia Celular",
    description:
      "Estrutura da célula, organelas, mitose, meiose, expressão gênica e sinalização celular. Base sólida para medicina, biotec e bioinformática.",
    topic: "biologia-celular",
    tags: ["cat:Ciências", "biologia", "célula", "genética"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 25,
  },

  // ── Vida (6) ──────────────────────────────────────────────────────────────
  {
    slug: "negociacao",
    title: "Negociação",
    description:
      "BATNA, ancoragem, escuta ativa e técnicas de fechamento. Negocie salário, contratos e conflitos do dia a dia com mais confiança.",
    topic: "negociacao",
    tags: ["cat:Vida", "negociação", "comunicação", "carreira"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 10,
  },
  {
    slug: "xadrez-estrategia",
    title: "Xadrez: Estratégia",
    description:
      "Aberturas clássicas, estruturas de peões, finais e padrões táticos. Do nível iniciante ao ELO 1400 com puzzles e análise de partidas.",
    topic: "xadrez",
    tags: ["cat:Vida", "xadrez", "estratégia", "táticas"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 15,
  },
  {
    slug: "desenho-iniciante",
    title: "Desenho para Iniciantes",
    description:
      "Ver para desenhar: proporção, perspectiva, luz e sombra. Exercícios progressivos do ponto e linha até o retrato e a paisagem.",
    topic: "desenho",
    tags: ["cat:Vida", "desenho", "arte", "perspectiva"],
    difficulty: Difficulty.EASY,
    estimatedHours: 12,
  },
  {
    slug: "escrita-criativa",
    title: "Escrita Criativa",
    description:
      "Personagens, conflito, voz narrativa e estrutura de história. Do conto à novela — escreva ficção que as pessoas queiram terminar de ler.",
    topic: "escrita-criativa",
    tags: ["cat:Vida", "escrita", "ficção", "narrativa", "criatividade"],
    difficulty: Difficulty.EASY,
    estimatedHours: 10,
  },
  {
    slug: "meditacao-mindfulness",
    title: "Meditação e Mindfulness",
    description:
      "Técnicas de atenção plena, respiração consciente e body scan. Práticas baseadas em MBSR para reduzir ansiedade e melhorar o foco.",
    topic: "meditacao",
    tags: ["cat:Vida", "meditação", "mindfulness", "bem-estar"],
    difficulty: Difficulty.EASY,
    estimatedHours: 8,
  },
  {
    slug: "tipografia-design",
    title: "Tipografia e Design",
    description:
      "Anatomia das letras, hierarquia tipográfica, escolha de fontes e composição visual. Para designers e não-designers que querem comunicar melhor.",
    topic: "tipografia",
    tags: ["cat:Vida", "tipografia", "design", "fontes", "comunicação-visual"],
    difficulty: Difficulty.MEDIUM,
    estimatedHours: 12,
  },
];

async function main() {
  console.log("Seeding users...");

  const admin = await db.user.upsert({
    where: { email: "admin@viare.dev" },
    update: {},
    create: {
      email: "admin@viare.dev",
      name: "Admin Viare",
      role: Role.ADMIN,
    },
  });

  await db.user.upsert({
    where: { email: "student1@viare.dev" },
    update: {},
    create: {
      email: "student1@viare.dev",
      name: "Alice Hacker",
    },
  });

  await db.user.upsert({
    where: { email: "student2@viare.dev" },
    update: {},
    create: {
      email: "student2@viare.dev",
      name: "Bob Pentest",
    },
  });

  console.log("Seeding 30 courses...");

  for (const course of COURSES) {
    await db.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        tags: course.tags,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours,
        status: CourseStatus.PUBLISHED,
      },
      create: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        topic: course.topic,
        tags: course.tags,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours,
        status: CourseStatus.PUBLISHED,
        sourceType: CourseSource.MANUAL,
        createdById: admin.id,
      },
    });
  }

  console.log(`✓ ${COURSES.length} cursos publicados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
