// Quiz questions seed data for QUIZ-type lessons.
// Keyed by `${courseSlug}/${moduleSlug}/${lessonSlug}`.
// Schema: QuizQuestion { question, options: string[], correctIndex, explanation, order }

export type SeedQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const QUIZ_QUESTIONS: Record<string, SeedQuizQuestion[]> = {
  "kali-linux-essencial/foundations/update-streams": [
    {
      question: "Qual repositório o Kali usa por padrão?",
      options: ["kali-last-snapshot", "kali-rolling", "kali-experimental", "kali-stable"],
      correctIndex: 1,
      explanation:
        "kali-rolling é o repositório padrão e recebe atualizações contínuas. kali-last-snapshot congela em pontos testados; kali-experimental tem pacotes instáveis.",
    },
    {
      question: "Em um laboratório de pentest de produção, que canal escolher?",
      options: [
        "kali-rolling com apt upgrade diário",
        "kali-last-snapshot",
        "kali-experimental",
        "Nenhum — mantenha sem updates",
      ],
      correctIndex: 1,
      explanation:
        "Para estabilidade em ambientes críticos, kali-last-snapshot congela num ponto conhecido e testado. Rolling é ótimo para estudo, arriscado em produção.",
    },
    {
      question: "Antes de qualquer upgrade grande, o que fazer?",
      options: ["Reboot", "Snapshot da VM", "Desabilitar firewall", "Instalar drivers novos"],
      correctIndex: 1,
      explanation:
        "Snapshot permite rollback instantâneo se o upgrade quebrar algo. É o custo zero que previne perda de tempo significativa.",
    },
  ],

  "kali-linux-essencial/vuln-assessment/false-positives": [
    {
      question: "Qual é a causa mais comum de falso positivo em scanners?",
      options: [
        "Scanner bugado",
        "Assinatura baseada em string de versão desatualizada",
        "Rede instável",
        "Usuário mal configurado",
      ],
      correctIndex: 1,
      explanation:
        "Scanners comparam strings de versão. Um Apache 2.4.29p1 (com patch) reporta vulnerabilidades do 2.4.29 base, porque a assinatura não sabe interpretar o sufixo.",
    },
    {
      question: "Como validar um achado de SQL injection reportado pelo scanner?",
      options: [
        "Confiar e reportar ao cliente",
        "Rodar o mesmo scanner de novo",
        "Reproduzir manualmente com Burp Repeater usando payloads específicos",
        "Fazer fuzzing automatizado",
      ],
      correctIndex: 2,
      explanation:
        'Reprodução manual com payloads controlados (ex. "id=1\'", "id=1 OR 1=1") é a única forma confiável. Se o comportamento bater com SQLi, é real.',
    },
    {
      question: "Quanto tempo é razoável para triar um único finding?",
      options: ["Menos de 1 minuto", "5 a 15 minutos", "1 hora", "Um dia inteiro"],
      correctIndex: 1,
      explanation:
        "Menos de 1 min é raso demais para validação séria. Uma hora ou mais é excesso para a maioria dos findings. 5-15 min é a janela onde se faz triagem de qualidade.",
    },
  ],

  "kali-linux-essencial/exploitation/payloads-vs-exploits": [
    {
      question: "Qual é a diferença entre exploit e payload?",
      options: [
        "São sinônimos",
        "Exploit é a técnica que aproveita a falha; payload é o que roda após o sucesso",
        "Exploit é defensivo; payload é ofensivo",
        "Payload é maior que exploit",
      ],
      correctIndex: 1,
      explanation:
        "Exploit é a 'arma' (técnica). Payload é o 'que fazer com o controle' (shell, reverse connection, injeção). Confundir os dois leva a decisões erradas.",
    },
    {
      question: "Um meterpreter reverse_tcp é um exemplo de:",
      options: ["Exploit", "Payload", "Encoder", "Auxiliary module"],
      correctIndex: 1,
      explanation:
        "Meterpreter é payload — roda depois que o exploit entregou controle. Ele fornece um canal de comunicação e funcionalidades como sessões, migration, keylogging.",
    },
    {
      question: "Quando faz sentido usar payload staged ao invés de stageless?",
      options: [
        "Sempre",
        "Quando há restrição de tamanho ou EDR monitora transferências grandes",
        "Somente em Windows",
        "Nunca",
      ],
      correctIndex: 1,
      explanation:
        "Staged divide em carregador pequeno + payload maior baixado depois. Útil quando o espaço inicial é limitado (shellcode compacto) ou para evitar detecção de transferências grandes.",
    },
  ],

  "pao-artesanal/levain/refrescos": [
    {
      question: "Qual proporção de refresco é ideal para manutenção do levain?",
      options: ["1:1:1", "1:5:5", "1:10:10", "1:20:20"],
      correctIndex: 0,
      explanation:
        "1:1:1 (1 parte de levain para 1 de farinha e 1 de água) mantém a colônia saudável com mínimo desperdício. É o padrão diário.",
    },
    {
      question: "Para fazer pão, qual proporção de refresco usar?",
      options: ["1:1:1", "1:5:5 ou maior", "1:0.5:0.5", "Não importa"],
      correctIndex: 1,
      explanation:
        "1:5:5 reduz a carga de ácido acumulado e dá mais vigor à colônia, resultando em fermentação mais limpa e miolo mais aberto.",
    },
    {
      question: "Seu levain está em pico às 8h mas você só vai misturar às 14h. O que fazer?",
      options: [
        "Usar mesmo assim",
        "Refrescar de novo às 10h com 1:5:5",
        "Descartar e começar do zero",
        "Colocar na geladeira para pausar",
      ],
      correctIndex: 1,
      explanation:
        "Levain em pico tem janela de ~2h. Passou disso, perde força. Um refresco 1:5:5 às 10h garante novo pico às 14h, no timing certo da mistura.",
    },
  ],

  "piano-classico/postura/claves-fa-sol": [
    {
      question: "Onde está localizado o Dó central na clave de sol?",
      options: [
        "Na primeira linha",
        "Na segunda linha",
        "Uma linha suplementar abaixo do pentagrama",
        "No espaço entre a terceira e quarta linha",
      ],
      correctIndex: 2,
      explanation:
        "Dó central fica uma linha suplementar abaixo do pentagrama em clave de sol — e uma linha suplementar acima em clave de fá. As duas se conectam nesse ponto.",
    },
    {
      question: "A clave de fá indica Fá em qual linha do pentagrama?",
      options: ["Primeira", "Segunda", "Terceira", "Quarta"],
      correctIndex: 3,
      explanation:
        "Clave de fá fixa a nota Fá na quarta linha, contando de baixo para cima. A partir dali, todas as outras notas se localizam por intervalos.",
    },
    {
      question: "Por que usamos duas claves no piano?",
      options: [
        "Convenção histórica sem motivo prático",
        "Para evitar muitas linhas suplementares ao cobrir a extensão do instrumento",
        "Porque cada mão é diferente",
        "Para economizar papel",
      ],
      correctIndex: 1,
      explanation:
        "O piano cobre ~7 oitavas. Com uma clave só, notas extremas exigiriam muitas linhas suplementares. Duas claves dividem o registro entre agudos (sol) e graves (fá).",
    },
  ],

  "piano-classico/dinamica/respiracao-musical": [
    {
      question: "O que é 'respiração musical'?",
      options: [
        "Respirar enquanto toca",
        "Uma pausa consciente entre frases musicais",
        "Técnica vocal aplicada ao piano",
        "Fermata obrigatória",
      ],
      correctIndex: 1,
      explanation:
        "É a pequena pausa consciente que separa frases, dando ao ouvinte tempo de processar. Sem ela, a música parece apressada mesmo em tempo correto.",
    },
    {
      question: "Quanto tempo deve durar uma respiração musical entre frases?",
      options: [
        "Um tempo inteiro",
        "Meio tempo",
        "Imperceptível — cerca de 1/8 de tempo ou menos",
        "Fica a critério do intérprete — quanto mais, mais expressivo",
      ],
      correctIndex: 2,
      explanation:
        "Imperceptível — o suficiente para o ouvido processar. Mais longa que isso parece hesitação ou erro. A precisão é parte do que a torna musical.",
    },
    {
      question: "Onde NÃO se deve respirar musicalmente?",
      options: [
        "No final de cada frase",
        "Em pontos de clímax emocional",
        "No meio de uma palavra/frase contínua, cortando a tensão",
        "Antes de mudanças de seção",
      ],
      correctIndex: 2,
      explanation:
        "Respiração no meio de uma frase que ainda está subindo em tensão quebra o arco musical. O ouvido espera continuidade; pausa ali soa como erro.",
    },
  ],
};
