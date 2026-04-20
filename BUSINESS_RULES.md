# Business Rules — Viare

Anchor pattern: `// RULE: XX-NN — descrição`

---

## AUTH — Autenticação & Autorização

**AUTH-01** — `auth()` é a única fonte de identidade. Nunca confiar em parâmetros de URL ou body para identificar o usuário.

```ts
// RULE: AUTH-01 — identidade sempre via auth()
const session = await auth();
const userId = session?.user?.id;
```

**AUTH-02** — Operações administrativas exigem `session.user.role === 'ADMIN'`. Verificar antes de qualquer mutação.

**AUTH-03** — Toda Route Handler que retorna dados de usuário deve incluir `userId` no `where` do Prisma.

**AUTH-04** — Redirecionar para `/login?callbackUrl=<path>` quando não autenticado em páginas protegidas.

---

## COURSE — Cursos & Módulos

**COURSE-01** — Transições de status são unidirecionais: `DRAFT → GENERATING → PUBLISHED`. Nunca voltar de PUBLISHED para DRAFT.

**COURSE-02** — Slug é imutável após o curso ser publicado (`status: PUBLISHED`). Nunca atualizar `slug` de um curso existente.

**COURSE-03** — `totalEnrollments` e `avgRating` são campos denormalizados — sempre atualizar via `increment`/transaction ao criar Enrollment ou Review.

**COURSE-04** — Cursos em status `GENERATING` não são visíveis para outros usuários (filtrar por `status: 'PUBLISHED'` em queries públicas).

**COURSE-05** — Um curso que falha na geração deve ter status revertido para `DRAFT`, nunca ficar preso em `GENERATING`.

---

## AI — Geração de Conteúdo

**AI-01** — Todo output de LLM que será parseado como JSON DEVE usar Zod para validação. Nunca `JSON.parse(raw) as T`.

**AI-02** — Contagem de módulos e lições depende do `scope` do curso (ver AI-05 e COURSE-06).

**AI-03** — `estimatedHours` varia por scope: OVERVIEW 1-4h, COMPLETE 8-20h, DEEP 20-60h. Range permitido: 1-60. Acima de 60h indica um plano de estudo multi-curso, não um curso único.

**AI-04** — O lifecycle de geração é: `status: GENERATING` ao criar o curso → gerar conteúdo lição a lição → `status: PUBLISHED` ao finalizar. Em caso de erro no meio: `status: DRAFT`.

**AI-05** — Scope-to-prompt mapping: o campo `scope` do curso é injetado no user message do outline prompt como constraint de módulos/lições.

- `OVERVIEW` → 1-2 módulos, 2 lições THEORY cada
- `COMPLETE` → 3-4 módulos, 2-3 lições THEORY cada (padrão)
- `DEEP` → 4-5 módulos, 3-4 lições THEORY cada, exemplos elaborados e casos extremos
- O `tone` (technical/practical/conceptual) continua sendo determinado pelo classificador de domínio, não pelo usuário.

---

## SUB — Subscriptions & Billing

**SUB-01** — Webhook do Stripe é a única fonte de verdade para status de subscription. Sempre verificar `stripe-signature` antes de processar.

**SUB-02** — `stripeCustomerId` é imutável após criação. Nunca sobrescrever.

**SUB-03** — Gating de feature: verificar `plan` E `status` simultaneamente. `plan: 'MONTHLY'` com `status: 'INACTIVE'` não dá acesso.

**SUB-04** — Eventos Stripe a tratar: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.

---

## PROG — Progresso & Gamificação

**PROG-01** — Progresso é forward-only. Nunca decrementar `progressPercent` de um enrollment.

**PROG-02** — `progressPercent` é sempre derivado: `Math.round(completedLessons / totalLessons * 100)`. Nunca setar manualmente.

**PROG-03** — Streak usa datas em UTC. `lastActiveDate` é comparado com `new Date()` em UTC para evitar bugs de timezone.

**ACH-01** — Achievements são idempotentes: usar `createOrSkip` pattern (`upsert` ou verificar existência antes). Nunca criar duplicatas.

---

## LAB — Labs & CTF

**LAB-01** — `flagHash` NUNCA é retornado para o cliente. Apenas comparado no servidor via bcrypt.

**LAB-02** — Hints são revelados de forma one-way: uma vez revelado, não pode ser "escondido". Débito de XP deve ser atômico com a revelação.

**LAB-03** — Conclusão de lab requer validação da flag correta. Nunca marcar como concluído sem verificação.

---

## CONTENT — Moderação de Conteúdo

**CONTENT-01** — Todo input de usuário que entra em prompt LLM DEVE ser sanitizado contra prompt injection antes da chamada ao Anthropic. Input isolado com delimitadores explícitos no prompt (não injetado diretamente).

**CONTENT-02** — As seguintes categorias são absolutamente bloqueadas e NUNCA chegam a `status: PUBLISHED`: CSAM, instruções de violência real, fabricação de armas/explosivos/agentes biológicos, malware funcional (código de ataque operacional), dados pessoais reais identificáveis.

**CONTENT-03** — Categorias restritas (segurança ofensiva operacional, drogas, conteúdo adulto) devem manter `status: DRAFT` com `requiresReview: true` para revisão manual. O caráter educacional (conceitual) vs operacional (passo a passo funcional) é o critério de distinção.

**CONTENT-04** — Cursos forkados herdam a classificação de conteúdo do curso original. Fork não é reset de moderação. Conteúdo novo adicionado no fork é classificado independentemente.

**CONTENT-05** — Mensagens de erro ao usuário sobre rejeição de conteúdo NÃO revelam os padrões de detecção utilizados. Sempre usar mensagens genéricas ("tópico não disponível", "revise o título").

---

## LEARN — Learning Graph & Study Plans

**LEARN-01** — Cursos podem ter dependências de outros cursos (`CourseDependency` junction table). A relação é direcional: curso A depende de curso B, não o contrário.

**LEARN-02** — Topic branch: de qualquer aula, o usuário pode gerar um novo curso sobre um tópico mencionado. O curso gerado é independente, mas registra `parentCourseId` e `parentLessonId` como origem.

**LEARN-03** — Antes de gerar um novo curso, o sistema DEVE buscar cursos existentes com o mesmo tópico. O usuário escolhe entre usar um existente ou gerar o próprio. Gerar duplicata sem confirmação explícita é proibido.

**LEARN-04** — Study Plan é uma coleção ordenada de cursos com dependências resolvidas. O progresso de um plano é derivado do progresso individual de cada curso membro — nunca armazenado separadamente.

**LEARN-05** — Um topic branch criado para "visão geral" (`scope: OVERVIEW`) tem no máximo 2 módulos e 3 lições each. Um branch para "aprofundamento" (`scope: DEEP`) segue os limites normais (AI-02).

**LEARN-06** — Fork de módulo herda a moderação de conteúdo do curso original (ver CONTENT-04). A geração de conteúdo novo no fork é classificada independentemente.

---

## CERT — Certificados

**CERT-01** — Certificado só é emitido para `enrollment.status === 'COMPLETED'`. Verificar antes de qualquer criação.

**CERT-02** — Certificado é idempotente: se já existe para um enrollmentId, retornar o existente sem criar duplicata.

**CERT-03** — `userNameSnapshot`, `courseTitleSnapshot` e `hoursSnapshot` são snapshots imutáveis capturados no momento da emissão. Nunca atualizar após criação.

**CERT-04** — `uuid` é o identificador público. `id` (cuid) é interno. URLs públicas usam sempre `uuid`.

**CERT-05** — Revogação é soft-delete: setar `revokedAt`. Nunca deletar o registro.

**CERT-06** — Certificados usam `onDelete: Cascade` em todas as FKs (consistente com o padrão do projeto). Deletar um Enrollment ou Course também deleta o Certificate associado. Para evitar perda acidental, revogar (CERT-05) antes de remover o curso ou enrollment. Revisitar se for necessário sobreviver a deleções de conta no futuro.
