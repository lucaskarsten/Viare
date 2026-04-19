<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## OMC — Skills & Agentes

### Skills (invocação direta)

| Keyword / Comando | O que faz |
|-------------------|-----------|
| `autopilot` / `/oh-my-claudecode:autopilot` | Execução autônoma full lifecycle: expand → plan → exec → QA → validate |
| `ralph` / `/oh-my-claudecode:ralph` | Loop até completar com verificação obrigatória; não para sozinho |
| `ulw` / `ultrawork` / `/oh-my-claudecode:ultrawork` | Paraleliza tarefas independentes com múltiplos agentes |
| `/oh-my-claudecode:team` | N agentes coordenados: plan → prd → exec → verify → fix |
| `ralplan` / `/oh-my-claudecode:ralplan` | Consenso antes de agir: planner + architect + critic deliberam |
| `deep interview` / `/oh-my-claudecode:deep-interview` | Entrevista socrática — usa quando requisitos são vagos |
| `/oh-my-claudecode:plan` | Planejamento estratégico com arquivo de plano |
| `/oh-my-claudecode:verify` | Verifica se a implementação realmente funciona (evidence-based) |
| `/oh-my-claudecode:ultraqa` | QA cíclico: test → verify → fix → repeat |
| `/oh-my-claudecode:debug` | Diagnóstico root-cause com hipóteses concorrentes |
| `/oh-my-claudecode:deep-dive` | Pipeline 2 estágios: trace (causal) → deep-interview |
| `/oh-my-claudecode:ai-slop-cleaner` | Remove código AI-gerado ruim, duplicações, dead code |
| `deslop` / `anti-slop` | Ativa ai-slop-cleaner automaticamente |
| `/oh-my-claudecode:visual-verdict` | Compara screenshot com referência visual |
| `ultrathink` | Reasoning profundo (extended thinking) |
| `deepsearch` | Busca exaustiva no codebase |
| `tdd` | Modo test-first |
| `cancelomc` / `/oh-my-claudecode:cancel` | Cancela modo ativo |

### Agentes OMC (via `Agent(subagent_type="oh-my-claudecode:<nome>")`)

| Agente | Modelo | Quando usar |
|--------|--------|-------------|
| `explore` | haiku | Busca rápida de arquivos e padrões no codebase |
| `analyst` | opus | Clareza de requisitos, restrições ocultas |
| `planner` | opus | Sequenciamento e planos de execução |
| `architect` | opus | Design de sistema, fronteiras, tradeoffs |
| `debugger` | sonnet | Root-cause analysis, falhas, stack traces |
| `executor` | sonnet | Implementação e refatoração |
| `verifier` | sonnet | Validação e evidências de conclusão |
| `tracer` | sonnet | Rastreamento causal com hipóteses concorrentes |
| `security-reviewer` | sonnet | Trust boundaries, OWASP, vulnerabilidades |
| `code-reviewer` | opus | Code review abrangente com severidade |
| `test-engineer` | sonnet | Estratégia de testes, cobertura, TDD |
| `designer` | sonnet | UX, interação, componentes visuais |
| `writer` | haiku | Documentação, comentários, conteúdo conciso |
| `git-master` | sonnet | Commits atômicos, rebase, histórico |
| `document-specialist` | sonnet | Docs de SDK/API/framework (Context7 + web) |
| `code-simplifier` | opus | Simplificação sem alterar comportamento |
| `critic` | opus | Revisão de planos e designs, desafios |
| `scientist` | sonnet | Análise de dados, raciocínio estatístico |
| `qa-tester` | sonnet | Testes manuais via tmux/CLI |

---

## Agentes Locais do Projeto (`agents/`)

Invocar via `Agent(subagent_type="oh-my-claudecode:executor", prompt="use agents/NOME.md como system prompt...")` ou referenciar diretamente.

| Arquivo | Domínio | Quando acionar |
|---------|---------|----------------|
| `agents/orchestrator.md` | Roteamento de tarefas | Tarefa complexa sem caminho claro; pede mapa de sequência |
| `agents/architect.md` | Design de features, ADRs | Nova feature, decisão arquitetural, impacto cross-cutting |
| `agents/security.md` | OWASP + Viare-specific | Qualquer mudança em auth, dados do usuário, APIs públicas |
| `agents/audit.md` | Revisão de rotas API | Nova route handler, mudança em middleware/proxy.ts |
| `agents/bugfix.md` | Diagnóstico de bugs | Bug reportado, erro inesperado, regressão |
| `agents/refactor.md` | Refatoração TypeScript strict | Arquivo grande, código duplicado, tipagem fraca |
| `agents/prisma.md` | Queries, migrations, índices | Schema change, query lenta, nova migration |
| `agents/seeds.md` | Dados de seed | Novo modelo, dados de dev/teste necessários |
| `agents/improvements.md` | Sugestões de melhoria | Revisão geral, oportunidades de otimização |
| `agents/componentize.md` | Extração de componentes React | Componente grande (>200 linhas), lógica duplicada em UI |
| `agents/slim.md` | Redução de arquivos grandes | Arquivo >300 linhas, responsabilidade múltipla |
| `agents/css.md` | CSS, Tailwind v4, design tokens | Classes Tailwind, globals.css, acessibilidade |
| `agents/readme.md` | Documentação | Novo módulo, API pública, README desatualizado |
| `agents/prompt-engineer.md` | Prompts de geração IA | Mudanças em prompts de cursos ou labs |
| `agents/ai-course-generator.md` | Pipeline `lib/generation.ts` | Geração de cursos, estrutura IA, output parsing |
| `agents/gamification.md` | Progress, achievements, streaks | XP, conquistas, streak logic, leaderboard |
| `agents/subscription.md` | Stripe, lifecycle, feature gating | Planos, webhooks Stripe, acesso por tier |
| `agents/lab-ctf.md` | Labs, CTF, flags, hints | Criação/edição de labs, sistema de flags |

---

## Roteamento rápido por situação

```
"Preciso implementar X do zero"          → autopilot  (ou ralph para garantia de conclusão)
"Tenho N tarefas independentes"          → ultrawork
"Não sei exatamente o que quero"         → deep interview  (clarifica antes de agir)
"Quero consenso antes de implementar"    → ralplan
"Tem um bug em produção"                 → agents/bugfix.md + /oh-my-claudecode:debug
"Mudei schema do banco"                  → agents/prisma.md
"Arquivo ficou muito grande"             → agents/slim.md + /oh-my-claudecode:ai-slop-cleaner
"Preciso de code review"                 → Agent(subagent_type="oh-my-claudecode:code-reviewer")
"Mudei auth ou dados de usuário"         → agents/security.md obrigatório
"CSS / design system / Tailwind"         → agents/css.md
"Quero verificar se está pronto"         → /oh-my-claudecode:verify
```
