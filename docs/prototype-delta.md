# Protótipo × Produto — Delta pixel-perfect

> Comparação granular entre o protótipo (`docs/Viare/Viare.html`, servido via `claudeusercontent.com`) e o produto em `http://localhost:3000`.
> Capturado em 2026-04-19 a partir de pares de screenshots de 5 telas: Dashboard, Catálogo, Descobrir, Metas, Revisar, Curso (detail).
> Meta: **pixel perfect**. Cada item lista strings exatas, referências de arquivo:linha e ação prescritiva.

## Convenções

- **Tipo** — `copy` (texto), `layout`, `cor`, `dado`, `estado`, `bug`.
- Prefixo `🔴` = bug ou divergência comportamental; `🟡` = texto/cor/spacing; `🟢` = dependente de seeds.

---

## 0. Sidebar (global, aparece em todas as telas)

Arquivo: [components/layout/SidebarNav.tsx](components/layout/SidebarNav.tsx), [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx)

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 0.1 | 🟡 copy | Contadores em `Biblioteca 7 · Revisar 29 · Metas 2 · Catálogo 30` | Apenas `Catálogo 30` | [SidebarNav.tsx:74-78](components/layout/SidebarNav.tsx#L74) | Adicionar `count` em `Revisar` (cards pendentes) e `Metas` (metas pendentes). Biblioteca já tem `enrollmentCount` — depende de 🟢 seeds |
| 0.2 | 🟢 dado | Usuário `Lucas G.` + `Pro · 12 dias seguidos` · avatar `LG` | `Dev` + `Pro · 0 dias seguidos` · avatar `D` | [SidebarNav.tsx:43,103-106](components/layout/SidebarNav.tsx#L43) | Formato deveria ser `Primeiro Sobrenome[0].` (com ponto). Atualizar `firstName` → `fullName = [first, last[0]+"."].join(" ")`. Seed do user dev precisa de sobrenome |
| 0.3 | 🟡 layout | Toggle idioma ordenado `EN PT` (PT ativo) | `PT EN` (PT ativo) | [SidebarNav.tsx:97-100](components/layout/SidebarNav.tsx#L97) | Trocar ordem: EN primeiro, PT segundo. Prototype mostra ordem alfabética ascendente |
| 0.4 | 🟢 dado | Seção `EM ANDAMENTO` com 4 cursos: `Kali Linux`, `Pão & fermentação`, `Piano clássico`, `Negociação` | Seção não aparece | [SidebarNav.tsx:80-93](components/layout/SidebarNav.tsx#L80) | Requer seeds de enrollments ativos para o user dev |
| 0.5 | 🟡 layout | Avatar flutuante `N` no canto inferior direito da viewport (fora do sidebar) | Presente | — | Identificar de onde vem esse avatar (provavelmente um floating action / notificações). Não foi localizado no código — investigar |

---

## 1. Dashboard (`/dashboard`)

Arquivo: [app/(platform)/dashboard/page.tsx](app/(platform)/dashboard/page.tsx)

### 1.1 Header

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 1.1.1 | 🟡 copy | `QUARTA, 18 DE ABRIL` (vírgula depois do dia) | `DOMINGO, 19 DE ABRIL` | [page.tsx:59-63](app/(platform)/dashboard/page.tsx#L59) | Formato já bate — ok |
| 1.1.2 | 🟡 copy | `Boa noite, Lucas.` (ponto final, sem `você`) | `Boa tarde, Dev.` | [page.tsx:99-101](app/(platform)/dashboard/page.tsx#L99) | Formato bate. Greeting depende da hora |
| 1.1.3 | 🟢 dado | Stats: `12 DIAS SEGUIDOS · 4/6 META SEMANAL · 218 AULAS AO TODO` | `0 · 0/6 · 0` | [page.tsx:106-119](app/(platform)/dashboard/page.tsx#L106) | Seeds |
| 1.1.4 | 🟡 copy | `Faltam 2 aulas para fechar a meta da semana. Continue de onde parou.` | `Faltam 6 aulas...` (idem) | [page.tsx:87-90](app/(platform)/dashboard/page.tsx#L87) | Lógica ok, depende de `weeklyGoalDone` |

### 1.2 Seção "Continuar" (só aparece se há `resumeEnrollment`)

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 1.2.1 | 🟢 dado | Card `Continuar` inteiro visível com lesson `Network reconnaissance with nmap`, meta `A SEGUIR · 14 MIN`, descrição, `Lesson 7 of 18 · Quiz + lab · Dif. estimada: moderada`, progress bar laranja parcial | Seção **não aparece** (usuário sem enrollments) | [page.tsx:122-171](app/(platform)/dashboard/page.tsx#L122) | Seeds + fix em 1.2.2-1.2.5 abaixo |
| 1.2.2 | 🟡 copy | Meta inferior: `Lesson 7 of 18 · Quiz + lab · Dif. estimada: moderada` (mistura PT/EN: "Lesson", "of") | Código: `Aula 1 de {count} · {kind}` | [page.tsx:160-162](app/(platform)/dashboard/page.tsx#L160) | Decidir política PT/EN. Protótipo usa `Lesson X of Y` (inglês) — provavelmente erro do proto. Manter PT; mas adicionar `Dif. estimada: {label}` ao final |
| 1.2.3 | 🟡 layout | Lesson card esquerdo: overlay inferior com `Ch. 03 / Kali Linux` em branco, fundo laranja + stripes | Código faz isso, mas título da lesson vem primeiro `h3` antes de descrição | [page.tsx:146-149](app/(platform)/dashboard/page.tsx#L146) | Validar que `resumeModuleNum` usa formato `03` zero-padded ✓ |
| 1.2.4 | 🟡 copy | Título da aula em destaque: `Network reconnaissance with nmap` (inglês na lesson) | Usa `resumeNextLesson?.title` direto | [page.tsx:155-157](app/(platform)/dashboard/page.tsx#L155) | Seeds com títulos de lesson no tom do protótipo |
| 1.2.5 | 🟡 layout | Progress bar fina, laranja, preenchida ~50%, alinhada abaixo da meta | Código tem `h-[3px] bg-border` com width `progressPercent`% | [page.tsx:164-166](app/(platform)/dashboard/page.tsx#L164) | OK — depende de dado |

### 1.3 Seção "Seus cursos" (tabs + grid)

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 1.3.1 | 🟡 copy | Tabs: `All` · `Em andamento` · `Não iniciados` · `Completed` — **mistura inconsistente** PT/EN (provável lapso do proto) | `Todos · Em andamento · Não iniciados · Concluídos` (tudo PT, consistente) | [page.tsx:177-180](app/(platform)/dashboard/page.tsx#L177) | Manter PT consistente — **não copiar o inglês do protótipo** (parece typo dele) |
| 1.3.2 | 🟡 copy | Tag do card: `TECHNOLOGY`, `CRAFT`, `MUSIC` (inglês) | Código usa `tags[0] ?? DIFFICULTY_LABELS[difficulty]` → renderiza `Iniciante`/`Intermediário`/`Avançado` | [page.tsx:186,202](app/(platform)/dashboard/page.tsx#L186) | Proto usa categorias em EN. Produto deveria usar categoria PT em uppercase: `TECNOLOGIA`, `OFÍCIO`, `MÚSICA`. Trocar fonte para `course.category` (já existe enum), formatar uppercase |
| 1.3.3 | 🟡 copy | Descrições curtas: "Segurança ofensiva, do primeiro boot ao laboratório completo" / "Do fermento à laminação, tempo e crosta" / "Leitura, escalas e suas três primeiras peças" | Descrições longas herdadas do seed IA | — | Regenerar descrições de seed com máx. ~12 palavras, tom poético |
| 1.3.4 | 🟡 copy | Meta do card: `6/18 aulas · Ontem · aula 7` / `7/12 aulas · Há 2 dias` / `4/24 aulas · Semana passada` | Código: `{done}/{total} aulas · {lastAccess}` (data formatada `19 abr`) | [page.tsx:208-212](app/(platform)/dashboard/page.tsx#L208) | Usar formatação relativa (`Ontem`, `Há 2 dias`, `Semana passada`) em vez de data absoluta. Adicionar sufixo `· aula N` quando há `IN_PROGRESS` |
| 1.3.5 | 🟡 layout | Card "gerar novo curso" **não aparece** no grid de 3 cards (prototype tem só os 3 cursos reais) | Código sempre renderiza o dashed card no final | [page.tsx:220-232](app/(platform)/dashboard/page.tsx#L220) | Decidir: mantemos o dashed card sempre (melhor UX) ou só no empty state? Prototype sugere só empty state |
| 1.3.6 | 🟡 layout | Cards mostram apenas tag chip (sem letra watermark grande tipo o catálogo) | Produto bate — sem letra grande — ok | — | — |

---

## 2. Catálogo (`/courses`)

Arquivo: [app/(platform)/courses/CatalogClient.tsx](app/(platform)/courses/CatalogClient.tsx)

### 2.1 Header

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 2.1.1 | 🟡 copy | Kicker: `CATÁLOGO · 30 CURSOS INICIAIS` | `CATÁLOGO · 30 CURSOS` | [CatalogClient.tsx:90-92](app/(platform)/courses/CatalogClient.tsx#L90) | Trocar `cursos` → `cursos iniciais` |
| 2.1.2 | 🟡 copy | Descrição P1: `Trinta cursos feitos à mão em seis domínios — grátis para sempre, em múltiplos idiomas. Adicione qualquer um à sua biblioteca, ou faça um remix pessoal.` | `Cursos feitos à mão em seis domínios — grátis para sempre, em múltiplos idiomas. Adicione qualquer um à sua biblioteca, ou faça um remix pessoal.` | [CatalogClient.tsx:96-98](app/(platform)/courses/CatalogClient.tsx#L96) | Prefixar `Trinta ` (número por extenso) quando contagem == 30. Usar `numberToPortugueseWord(count)` ou hardcode `Trinta cursos` até cardinalidade crescer |
| 2.1.3 | 🟢 dado | `30 CURSOS · 1273k ALUNOS · 8 IDIOMAS` | `30 · 0 · 8` | [CatalogClient.tsx:100-113](app/(platform)/courses/CatalogClient.tsx#L100) | Seeds com `totalEnrollments` realistas |

### 2.2 Bloco "Grátis sempre"

Compare lado a lado:

| Protótipo | Produto |
|-----------|---------|
| **GRÁTIS SEMPRE** Esses **cursos-base** são grátis — sempre. **Pode adicionar** à biblioteca do jeito que estão, ou **fazer um remix pessoal** que você edita, traduz e expande. **Gerar algo que não está aqui? Também é sempre opção.** | **GRÁTIS SEMPRE** Esses **cursos** são grátis — sempre. **Adicione** à biblioteca do jeito que estão, ou **faça um remix** que você edita, traduz e expande. **Gerar algo que não está aqui? Também é sempre opção.** |

| # | Tipo | Ação |
|---|------|------|
| 2.2.1 | 🟡 copy | `cursos` → `cursos-base` |
| 2.2.2 | 🟡 copy | `Adicione` (imperativo) → `Pode adicionar` (permissivo, mais suave) |
| 2.2.3 | 🟡 copy | `faça um remix` → `fazer um remix pessoal` (infinitivo + `pessoal`) |

Linhas: [CatalogClient.tsx:116-128](app/(platform)/courses/CatalogClient.tsx#L116).

### 2.3 Cards de curso

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 2.3.1 | 🟡 layout | Watermark grande em duas letras: `Py` `Ka` `Rs` `Ma` (maiúscula + minúscula) | `RP`, `SC`, `MI` (duas maiúsculas) ou letra única | [lib/catalog.ts `displayLetter`](lib/catalog.ts) | Refatorar `displayLetter` para: pegar `title.split(" ")[0].slice(0,2)` e aplicar `[0].toUpperCase() + [1].toLowerCase()` |
| 2.3.2 | 🟢 dado | Títulos curtos: `Python, from zero`, `Kali Linux`, `Rust ownership`, `Machine Learning (intuição)` | `Rust: Programação de Sistemas`, `SQL Completo`, `Machine Learning Prático` (longos, genéricos) | — | Regerar seeds com títulos concretos + ângulo (ex. `Rust ownership`, `Python, from zero`) |
| 2.3.3 | 🟢 dado | Descrições em 1-2 frases diretas: `"De variáveis a web scrapers em 22 aulas. Sem código prévio."` / `"Borrow checker, lifetimes e por que você nunca mais vai temer um segfault."` | Descrições técnicas longas de 3+ frases | — | Regerar descrições com prompt ajustado: ≤ 20 palavras, 1-2 frases, tom conversacional |
| 2.3.4 | 🟡 cor | Rust: vermelho-telha quente (mais saturado) | Rust: marrom-tan dessaturado | [lib/catalog.ts `courseAccentGradient`](lib/catalog.ts) | Ajustar função para gerar paletas mais saturadas, ou mapear categoria → paleta fixa com saturação maior |

### 2.4 Filtros (chips + busca)

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 2.4.1 | ✅ | `Todos 30 · Tecnologia 6 · Línguas 5 · Música 4 · Cozinha & ofícios 5 · Ciências 4 · Vida 6` | Bate | [CatalogClient.tsx:32-40](app/(platform)/courses/CatalogClient.tsx#L32) | — |
| 2.4.2 | 🟡 copy | Placeholder busca: `Buscar no catálogo…` | Bate | [CatalogClient.tsx:157](app/(platform)/courses/CatalogClient.tsx#L157) | — |

---

## 3. Descobrir (`/discover`)

Arquivo: [app/(platform)/discover/FeedClient.tsx](app/(platform)/discover/FeedClient.tsx)

### 3.1 Header

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 3.1.1 | 🟡 layout | Descrição ocupa 2 linhas no proto (wrap natural); busca ao lado com `300px+` de largura, alinhada ao topo/baseline do h1 | Similar mas busca aparece com **largura menor (~280px)** e alinhamento diferente | [FeedClient.tsx:275-283](app/(platform)/discover/FeedClient.tsx#L275) | Aumentar largura da busca para `w-80` (320px) e validar alinhamento. Header usa `items-end` — validar se o `baseline` bate |
| 3.1.2 | 🟡 copy | Placeholder: `Buscar 4.218 cursos públicos…` — número real | Hardcoded `4.218` | [FeedClient.tsx:277](app/(platform)/discover/FeedClient.tsx#L277) | Trocar por contagem real via prop do servidor |

### 3.2 Sidebar lateral (coluna direita)

#### 3.2.1 Sugeridos para você

| # | Tipo | Protótipo | Produto | Linha |
|---|------|-----------|---------|-------|
| 3.2.1.a | 🟡 copy | `OSINT fundamentals` | `OSINT Fundamentals` | [FeedClient.tsx:100](app/(platform)/discover/FeedClient.tsx#L100) |
| 3.2.1.b | 🟡 copy | `Massa caseira` | `Massa Caseira` | [FeedClient.tsx:101](app/(platform)/discover/FeedClient.tsx#L101) |
| 3.2.1.c | 🟡 copy | `Harmonia jazz` | `Harmonia Jazz` | [FeedClient.tsx:102](app/(platform)/discover/FeedClient.tsx#L102) |

**Regra**: sentence case preservando acrônimos.

#### 3.2.2 Tópicos que você explora

| Posição | Protótipo | Produto | Linha |
|---------|-----------|---------|-------|
| 1 (size 3) | `security` | `segurança` | [FeedClient.tsx:106](app/(platform)/discover/FeedClient.tsx#L106) |
| 2 (size 2) | `linux` | `linux` (ok) | 107 |
| 3 (size 2) | `ofício` | `ofício` (ok) | 108 |
| 4 (size 1) | `music` | `música` | 109 |
| 5 (size 1) | `statistics` | `estatística` | 110 |
| 6 (size 1) | `negociação` | `negociação` (ok) | 111 |
| 7 (size 1) | `history` | `história` | 112 |
| 8 (size 1) | `typography` | `tipografia` | 113 |

**Regra detectada**: tópicos técnicos universais ficam em EN (`security`, `music`, `statistics`, `history`, `typography`); tópicos com identidade cultural PT (`ofício`, `negociação`) e `linux` (comum a ambos) permanecem como estão. Atualizar array `TOPICS` em FeedClient.tsx:105-114.

#### 3.2.3 Pessoas para seguir

| # | Tipo | Protótipo | Produto | Linha |
|---|------|-----------|---------|-------|
| 3.2.3.a | ✅ | `Elena Marchetti / tipografia + design lento` | bate | [FeedClient.tsx:117](app/(platform)/discover/FeedClient.tsx#L117) |

### 3.3 Cards do feed

Posts no proto mostram mesma estrutura visual. Diferenças menores de micro-spacing — aceitar como consistente.

---

## 4. Metas (`/goals`)

Arquivo: [app/(platform)/goals/page.tsx](app/(platform)/goals/page.tsx)

### 4.1 Header

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 4.1.1 | 🔴 copy | Kicker: `ESTA SEMANA · 14 — 20 ABR` (sem ponto depois de `ABR`, sem `DE`) | `ESTA SEMANA · 13 DE ABR. — 19 DE ABR.` | [page.tsx:46](app/(platform)/goals/page.tsx#L46) | Reescrever formato: `{day} — {day} {MONTH_ABBR}` sem pontos. Ex.: `14 — 20 ABR`. Usar `toLocaleDateString("pt-BR", { day: "numeric" })` e anexar `MON.toUpperCase()` apenas no fim |
| 4.1.2 | 🔴 copy | Título dinâmico: `Você está no ritmo.` (quando meta sendo cumprida) | Título fixo: `Metas` | [page.tsx:78](app/(platform)/goals/page.tsx#L78) | **Mudança estrutural**: substituir `Metas` por frase dinâmica:<br>- `Você está no ritmo.` (≥70% da meta no prazo)<br>- `Falta pouco.` (50-70%)<br>- `Hora de retomar.` (<50%)<br>- `Meta batida.` (=100%) |
| 4.1.3 | 🔴 copy | Subtítulo (descritivo, ausente no produto): `Quatro aulas feitas, faltam duas. Sessões pequenas e constantes sempre vencem maratonas.` | **Não existe** | — | Adicionar `<p>` abaixo do h1 com template: `{doneExtenso} aula(s) feita(s), faltam {remaining}. Sessões pequenas e constantes sempre vencem maratonas.` |

### 4.2 Card "Meta semanal"

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 4.2.1 | 🟡 layout | Número grande `4` + `/6` menor **seguido inline** de `aulas esta semana` muted (todos na mesma linha, baseline alinhada) | `0/6` empilhado, `aulas esta semana` em linha SEPARADA abaixo | [page.tsx:91-97](app/(platform)/goals/page.tsx#L91) | Refatorar: colocar `aulas esta semana` na mesma linha com `flex items-baseline` à direita do `/6` |
| 4.2.2 | 🔴 copy | Week strip com **iniciais em EN**: `M T W T F S S` (Monday first, single letter) | `S T Q Q S S D` (pt-BR) | [page.tsx:48](app/(platform)/goals/page.tsx#L48) | Trocar `DAY_LABELS` para inglês: `["M","T","W","T","F","S","S"]`. Pequena inconsistência com o restante da UI em PT, mas é o que o proto usa. **Validar com design** se é intencional ou lapso |
| 4.2.3 | 🔴 bug | Week strip: só os 3 dias efetivamente cumpridos (14,15,17) têm `✓`; dia atual (17 qui) é círculo **dashed**; futuros (18,19,20) são círculos **vazios** | Todos os dias passados exibem `✓` independente de progresso real. Hoje dashed ✓. Futuros vazios ✓ | [page.tsx:48-55,100-118](app/(platform)/goals/page.tsx#L48) | Trocar `done = isPast && !isToday` por consulta real: `done = userProgress.some(p => isSameDay(p.completedAt, d))` |

### 4.3 Card "Sequência" (direita)

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 4.3.1 | 🟡 copy | Título: `Sequência atual` (duas palavras) | `Sequência` | [page.tsx:135](app/(platform)/goals/page.tsx#L135) | Trocar para `Sequência atual` |
| 4.3.2 | 🟡 copy | Legenda: `DIAS CONSECUTIVOS` (**uppercase mono**) | `dias consecutivos` (lowercase) | [page.tsx:139](app/(platform)/goals/page.tsx#L139) | Aplicar `uppercase tracking-[0.1em] font-mono text-[11px]` |
| 4.3.3 | 🟡 copy | Recorde: `Recorde: 23 dias · Fev 2026` (inclui mês) | `Recorde: 0 dias` | [page.tsx:140-142](app/(platform)/goals/page.tsx#L140) | Adicionar sufixo `· {MesAbrev} {ano}` do recorde histórico. Campo precisa existir no schema (`userStreak.longestStreakAt`) |
| 4.3.4 | 🔴 bug | Heatmap 90 dias: blocos preenchidos em **azul accent** nos dias com atividade, espalhados ao longo do período | `bg-border/50` para vazio, `bg-accent` **para os primeiros `currentStreak` índices** — ordem errada (pinta do começo da grid em vez de mapear para datas) | [page.tsx:143-151](app/(platform)/goals/page.tsx#L143) | Mapear cada célula para uma data real: `const date = subDays(today, 89 - i)`; pintar se houve `UserProgress.completedAt` naquele dia |
| 4.3.5 | 🟡 cor | Blocos preenchidos em **cor accent/azul sólido** | `bg-accent` ok — validar após fix de 4.3.4 | — | — |

### 4.4 Card "Tempo investido"

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 4.4.1 | 🟡 layout | Formato `47h 22m` com `h` e `m` em **tamanho menor sobrescrito** (superscript visual): `47`**h** `22`**m** | `47h 22m` tudo mesma altura | [page.tsx:157](app/(platform)/goals/page.tsx#L157) | Splitar: `<span>47</span><span class="text-[28px] ml-0.5">h</span> <span>22</span><span class="text-[28px] ml-0.5">m</span>` (tamanho dos sufixos ≈ 58% do número) |
| 4.4.2 | 🔴 dado | `47h 22m` real calculado | Hardcoded | [page.tsx:157](app/(platform)/goals/page.tsx#L157) | Somar `UserProgress.timeSpent` do usuário |
| 4.4.3 | 🔴 dado | `INV_BARS` com dados reais por curso | Hardcoded `62/21/11/6` | [page.tsx:10-15](app/(platform)/goals/page.tsx#L10) | Agregar `sum(UserProgress.timeSpent) by course`, converter em % do total |
| 4.4.4 | 🟡 copy | Rótulo do curso Pão: `Pão` (curto) | Igual no hardcode | — | Ok, mas após fix 4.4.3 vai vir o nome completo — truncar visualmente |

### 4.5 Card "Goal breakdown" (rodapé da Meta semanal)

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 4.5.1 | 🔴 dado | `Kali Linux … 3 aulas` / `Pão & fermentação … 1 aula` agregados reais | Hardcoded | [page.tsx:5-8](app/(platform)/goals/page.tsx#L5) | Agregar `UserProgress` da semana corrente agrupado por curso |

### 4.6 Seção "Histórico"

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 4.6.1 | 🔴 dado | Últimas 6 semanas reais | Fórmula mock `i % 3 === 2` | [page.tsx:57-69](app/(platform)/goals/page.tsx#L57) | Agregação real por semana (bucketing dominical ou segunda-base, consistente com `startOfWeek`) |

---

## 5. Revisar (`/review`)

Arquivos: [app/(platform)/review/page.tsx](app/(platform)/review/page.tsx), [components/ReviewClient.tsx](components/ReviewClient.tsx)

### 5.1 Header

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 5.1.1 | 🔴 copy | Título dinâmico: `29 cartões pendentes` (número + sub) quando há cartões, sem título fallback visto | `Tudo em dia ·` (com ponto flutuante suspeito) no empty state | `ReviewClient.tsx` — não lido inteiro | Mostrar `{totalDue} cartões pendentes` quando `totalDue > 0`, `Tudo em dia.` (com ponto final real, sem `·`) quando zero. Remover `·` dangling |
| 5.1.2 | 🔴 copy | Subtítulo dinâmico: `11 estão atrasados — revise primeiro para não cascatear.` | Produto no empty: `10 minutos por dia constantes mantêm o que você aprendeu no lugar.` | [review/page.tsx:65-68](app/(platform)/review/page.tsx#L65) | Já tem lógica ternária — validar que pluralização (`1 está atrasado` vs `N estão atrasados`) funciona |
| 5.1.3 | 🔴 copy | Botões: `Revisar tudo · ~15 min` / `Só os 11 atrasados` / `Sessão customizada…` | Empty: `Revisar tudo · ~0 min` / `Só os 0 atrasados` | — | No empty state, esconder botão `Só os N atrasados` se `N === 0`; desabilitar `Revisar tudo` ou trocar para `Explorar cartões` |
| 5.1.4 | 🟡 cor | Streak box "12d" em **accent azul sólido**, com `d` menor sobrescrito, heatmap 4 semanas **cheio de blocos preenchidos em azul accent** | "0d" em gray, heatmap quase todo vazio (1 bloco preto isolado) | [ReviewClient.tsx] | Estilizar `Xd` com `d` menor como em 4.4.1. Heatmap deveria usar mesma cor accent de /goals |

### 5.2 Pendentes por curso

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 5.2.1 | 🟡 layout | Cada curso renderiza um **card** com:<br>• barra lateral colorida 3px<br>• nome do curso em bold<br>• 3 chips pequenos: `N atrasados` `N aprendendo` `N novos` (backgrounds sutis)<br>• progress bar fina laranja<br>• `N / M aprendidos` em font-mono muted<br>• contador `N pendentes` à direita<br>• botão `Revisar →` à direita | Produto no empty: só texto `Nenhum curso em andamento.` | [ReviewClient.tsx] | Depende de seeds. Implementar card como descrito |
| 5.2.2 | 🟡 cor | Chips de estado:<br>- `atrasados`: fundo vermelho-pastel/rosa muito sutil<br>- `aprendendo`: fundo bege/neutro<br>- `novos`: fundo azul-muito-claro | — | — | Adicionar 3 classes utilitárias: `chip-overdue`, `chip-learning`, `chip-new` em [globals.css](app/globals.css) |

### 5.3 Esta semana (bar chart)

Aparece no produto em empty state mas **não aparece no protótipo** (substituído pelo breakdown por curso rico). Em estado não-empty, esconder ou mover para baixo.

| # | Tipo | Ação |
|---|------|------|
| 5.3.1 | 🔴 dado | Schedule hardcoded `[9,14,7,11,5,8]` em [review/page.tsx:55-63](app/(platform)/review/page.tsx#L55). Substituir por projeção real do SRS |

---

## 6. Curso detalhe (`/courses/[slug]`)

Arquivo: [app/(platform)/courses/[slug]/page.tsx](app/(platform)/courses/[slug]/page.tsx), [components/CourseDetailTabs.tsx](components/CourseDetailTabs.tsx)

### 6.1 Header do curso

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 6.1.1 | 🟢 dado | Título: `Kali Linux` (2 palavras) | `Kali Linux Essencial` (3 palavras) | — | Seeds: usar nomes curtos |
| 6.1.2 | 🟡 copy | Kicker: `TECHNOLOGY` (single tag, EN uppercase) | `TECH · INTERMEDIÁRIO` (categoria + dificuldade) | [page.tsx:147-149](app/(platform)/courses/[slug]/page.tsx#L147) | Remover `· {difficulty}` do kicker (dificuldade já aparece na linha meta abaixo). Usar categoria completa em PT uppercase (`TECNOLOGIA`) |
| 6.1.3 | 🟡 copy | Descrição: 1 linha curta: `Segurança ofensiva, do primeiro boot ao laboratório completo` | Descrição: 2 linhas, técnica | — | Seeds com descrições curtas |
| 6.1.4 | 🔴 copy | Meta após descrição: `★ 4.8 (1,248) · 3.2k alunos · Gerada por IA · você personalizou 3 aulas` | `Intermediário · 30h estimadas · 0 alunos` | [page.tsx:156-162](app/(platform)/courses/[slug]/page.tsx#L156) | **Mudança grande**: trocar linha meta para:<br>• `★ {avgRating} ({totalRatings})` + contagem alunos<br>• `Gerada por IA` (badge)<br>• `você personalizou N aulas` quando enrollment com edits<br>• Dificuldade + duração movem para o card lateral |
| 6.1.5 | 🔴 copy | Botões: `Continuar aula 7 →` (primary) · `⑂ Fork & remix` · `Personalizar` · `★` (star favorito) | `Começar curso →` · `Compartilhar` | [page.tsx:163-173](app/(platform)/courses/[slug]/page.tsx#L163) | Adicionar:<br>• `Fork & remix` (ícone `⑂` ou Lucide `GitBranch`)<br>• `Personalizar` (trigger editor)<br>• Favorito (star button)<br>• Renomear botão primário quando há enrollment: `Continuar aula N →` |

### 6.2 Card lateral de progresso

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 6.2.1 | 🟢 dado | `34%` grande com `%` menor (superscript) | `0%` mesmo formato | [page.tsx:178-180](app/(platform)/courses/[slug]/page.tsx#L178) | Formato ok — depende de dado |
| 6.2.2 | 🟡 copy | Label: `6 / 18 aulas` abaixo do % (sem label "concluído") + progress bar laranja | `concluído` + progress bar + lista 3 métricas abaixo | [page.tsx:181-187](app/(platform)/courses/[slug]/page.tsx#L181) | Mover `{done}/{total} aulas` para logo abaixo do %, remover texto `concluído`. Progress bar depois |
| 6.2.3 | 🔴 copy | Lista de métricas:<br>`Restante est.` `6h 20m`<br>`Quizzes` `4 / 12`<br>`Flashcards` `28`<br>`Notas` `9` | `Aulas concluídas` `0/0`<br>`Tempo estimado` `30h`<br>`Módulos` `0` | [page.tsx:189-202](app/(platform)/courses/[slug]/page.tsx#L189) | Trocar métricas:<br>• `Aulas concluídas` → remover (já mostrada acima)<br>• `Tempo estimado` → `Restante est.` (tempo restante, não total)<br>• `Módulos` → substituir por 3 novos: `Quizzes N/M`, `Flashcards N`, `Notas N` |

### 6.3 Tabs de conteúdo

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 6.3.1 | 🔴 copy | `Estrutura` · `Mapa` · `Minhas notas` · `Flashcards` · `Avaliações` | `Visão geral` · `Aulas` · `Flashcards` · `Avaliações` · `Notas` | [CourseDetailTabs.tsx] | Renomear:<br>• `Visão geral` → remover (info já no header)<br>• `Aulas` → `Estrutura`<br>• Adicionar `Mapa` (novo: visualização de dependências)<br>• `Notas` → `Minhas notas` |

### 6.4 Seção "Remixes públicos"

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 6.4.1 | 🔴 seção | Existe: 3 cards horizontais (MO, DM, AR) com nome, handle, `X weeks ago`, título do remix, metadata `16 aulas · +4 · -2 · reordered`, ícone estrela + count de stars, footer `Gostou de algum? Dê fork — mude o que quiser. Sua versão é sua.` | **Seção não existe** | — | Implementar seção inteira. Requer:<br>• Modelo `CourseRemix` no schema (course base + autor + deltas)<br>• Query de remixes públicos<br>• Componente `<RemixCard>`<br>• Contador de ações (adds/removes/reorders) |
| 6.4.2 | 🔴 copy | Header: `⑂ Remixes públicos` + `3 PESSOAS LEVARAM ESSE CURSO EM OUTRA DIREÇÃO` | — | — | Criar h2 com ícone `⑂` + subtítulo mono uppercase |

### 6.5 Módulos e aulas

| # | Tipo | Protótipo | Produto | Linha | Ação |
|---|------|-----------|---------|-------|------|
| 6.5.1 | 🟡 layout | Módulo numerado: `01 Foundations` com number grande mono à esquerda, título inline | Verificar `CourseDetailTabs.tsx` | [CourseDetailTabs.tsx] | Validar formato — aparentemente bate |
| 6.5.2 | 🟡 copy | Linha da lesson: `✓ Lesson 1 / What Kali actually is / READ / 8 min` (inglês) | Similar mas em PT | — | Lesson titles em EN no proto é lapso; manter PT. Badge tipo: `READ`/`QUIZ`/`LAB` em uppercase — validar formatação |

---

## 7. Tokens de design (validação global)

Protótipo e produto compartilham o mesmo vocabulário visual. Itens a validar:

| # | Tipo | Ação |
|---|------|------|
| 7.1 | 🟡 cor | Accent primário — validar que o produto usa `#2a5fcc` ou similar (azul do prototype). Parece bater mas conferir na fonte |
| 7.2 | 🟡 cor | Paletas de cursos por categoria — mapear cor primária (Tecnologia = laranja, Ofício = verde-oliva, Música = azul-aço, Línguas = roxo-terroso, Ciências = bege, Vida = cinza-quente). Atualmente gerado por hash do id em `courseAccentGradient`; fixar por categoria |
| 7.3 | 🟡 cor | Heatmaps (goals + review) usam mesma cor accent. Bate — só garantir que `.bg-accent` nos dois é exatamente a mesma classe |
| 7.4 | 🟡 layout | `font-mono` em kickers, legendas e números mono — parece bater. Validar `tracking` (`0.08em` / `0.1em` / `0.12em`) consistente |
| 7.5 | 🟡 layout | Border radius: `--radius` (chips/inputs ≈ 6-8px), `--radius-lg` (cards ≈ 10px). Bate. Validar nos componentes |

---

## 8. Ordem sugerida de ataque (pixel perfect)

Ordenado por dependências + impacto visual:

### Sprint 1 — Texto (baixo risco, alto impacto)

1. **Sidebar**: contadores em Revisar/Metas, ordem `EN PT` do toggle (0.1, 0.3)
2. **Catálogo**: microcopy header + bloco "Grátis sempre" (2.1, 2.2)
3. **Discover**: tópicos bilíngues + sugeridos sentence case (3.2.1, 3.2.2)
4. **Goals**: formato de data `14 — 20 ABR`, título dinâmico, subtítulo (4.1.1-4.1.3)
5. **Goals**: renomear `Sequência` → `Sequência atual` + `DIAS CONSECUTIVOS` uppercase (4.3.1-4.3.2)
6. **Review**: título dinâmico `N cartões pendentes` + botões condicionais (5.1.1-5.1.3)
7. **Curso detail**: tabs, botões, card lateral (6.3, 6.1.5, 6.2.3)

### Sprint 2 — Layout e cor

8. **Catálogo cards**: `displayLetter` → `Py`, `Ka`, etc. (2.3.1)
9. **Goals Meta Semanal**: layout inline de `N/M aulas esta semana` (4.2.1)
10. **Goals week strip**: `M T W T F S S` (4.2.2) — **decidir com design**
11. **Goals Tempo investido**: superscript `h`/`m` (4.4.1)
12. **Review streak heatmap**: cor accent azul, formato `Xd` (5.1.4)
13. **Review chips**: `atrasados/aprendendo/novos` com cores pastel (5.2.2)
14. **Paletas de curso** por categoria (7.2)

### Sprint 3 — Bugs e dados

15. 🔴 **Goals week strip** real progress (4.2.3) — bug
16. 🔴 **Goals heatmap 90d** mapear datas reais (4.3.4) — bug
17. 🔴 **Goals**: remover hardcodes `INV_BARS`, `47h 22m`, `GOAL_BREAKDOWN`, `history` (4.4.2-3, 4.5.1, 4.6.1)
18. 🔴 **Review**: schedule real (5.3.1)
19. 🔴 **Dashboard continuar**: polir meta line (1.2.2)

### Sprint 4 — Seeds e conteúdo novo

20. 🟢 Seeds: user dev com sobrenome + streak + enrollments ativos (0.2, 0.4, 1.1.3, 1.2.1)
21. 🟢 Seeds: títulos e descrições curtas por curso (1.3.3, 2.3.2, 2.3.3, 6.1.1, 6.1.3)
22. 🟢 Seeds: `totalEnrollments` realistas (2.1.3)

### Sprint 5 — Novas features (requerem schema)

23. 🔴 **Curso detail**: meta com rating + autoria + personalização (6.1.4)
24. 🔴 **Curso detail**: seção `Remixes públicos` inteira (6.4) — requer modelo `CourseRemix`
25. 🔴 **Goals**: `longestStreakAt` no schema (4.3.3)

---

## 9. Processo de verificação

Após cada sprint:

1. Abrir tela no dev server
2. Tirar screenshot lado a lado com o protótipo
3. Rodar [`/oh-my-claudecode:visual-verdict`](/.claude/commands/oh-my-claudecode/visual-verdict.md) para diff visual
4. Validar diffs residuais

Para automação: considerar adicionar Playwright snapshot-testing por tela (tirar screenshot do prototype, armazenar como baseline, comparar pixel-a-pixel com viewport de 1920x1080).

---

## 10. Itens fora de escopo deste delta

- **Performance / bundle size**
- **Acessibilidade (a11y)** — auditar separadamente depois de atingir paridade visual
- **Dark mode** — protótipo só tem light
- **Responsivo** — todos os screenshots são 1920x1080; mobile precisa de audit próprio
