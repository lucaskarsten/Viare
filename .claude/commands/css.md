# /css — CSS Review & Refactor

Audita e refatora CSS nos arquivos modificados (ou no caminho especificado).

**Uso:**
- `/css` — audita arquivos com mudanças no git diff atual
- `/css <caminho>` — audita arquivo ou diretório específico

## Passo 1 — Escopo

Se argumento fornecido: usar esse path como alvo.

Se não: identificar arquivos com alterações CSS via:
```bash
git diff --name-only HEAD
```
Filtrar por arquivos `.tsx`, `.ts` (com className) e `.css` modificados.

## Passo 2 — Auditoria

Para cada arquivo no escopo, identificar e catalogar todas as ocorrências por severidade:

**🔴 Crítico** (corrigir sempre):
- Elemento interativo (button, a, input, [onClick], [role="button"]) sem `:focus-visible`
- Tokens BEM em código novo: `var(--ink)`, `var(--paper)`, `var(--paper-2)`, `var(--paper-3)`, `var(--rule)`, `var(--rule-soft)`
- Inline styles para layout: `style={{ display, gap, padding, margin, width, height, position, flexDirection }}`
- `!important` sem comentário explicando o motivo

**🟡 Major** (corrigir se comportamento visual preservado):
- Valores arbitrários que duplicam escala Tailwind com diferença ≤1px: `px-[16px]` → `px-4`, `py-[12px]` → `py-3`, `gap-[8px]` → `gap-2`
- Classe custom nova em `globals.css` para algo que cabe em ≤3 utilities
- Concatenação manual de classes: `` `flex ${isActive ? "bg-accent" : ""}` `` → `cn("flex", isActive && "bg-accent")`
- Hardcode de cor hex que tem token semântico equivalente: `bg-[#F4F5F7]` → `bg-background`

**🟢 Minor** (reportar, corrigir só se óbvio):
- Ordem de utilities fora de convenção (layout → espaçamento → tipografia → cor → interação)
- Classe custom em `globals.css` com implementação duplicada de outra já existente
- Comentário que descreve WHAT ao invés de WHY

## Passo 3 — Relatório

Emitir relatório estruturado antes de alterar qualquer arquivo:

```
=== CSS Audit ===

components/layout/Sidebar.tsx
  🔴 L34: inline style layout → style={{ gap: "8px" }} → className="gap-2"
  🟡 L67: px-[18px] → diferença 2px, manter ⚠️ (documentar se intencional)
  🟡 L89: concatenação manual → usar cn()
  🟢 L112: ordem de utilities — cor antes de espaçamento

app/globals.css
  🔴 .chip: hover sem focus-visible
  🟡 .cq-progress-bar: implementação duplica .progress-bar — consolidar

Total: 2 críticos · 3 majors · 1 minor
```

## Passo 4 — Corrigir

Aplicar todas as correções 🔴 e 🟡 identificadas.

Para cada alteração:
- Verificar que o comportamento visual é **equivalente** (não melhorado — só normalizado)
- Não alterar lógica de componente, props, ou estrutura JSX além do necessário
- Se houver dúvida sobre equivalência visual (ex: valor arbitrário intencional do design): **manter original**, marcar como ⚠️ e explicar no relatório final

## Passo 5 — Verificar

```bash
npm run lint
npx tsc --noEmit
```

Reportar resultado e emitir resumo final:

```
=== CSS Refactor — Resultado ===
✅ 2 críticos corrigidos
✅ 2 de 3 majors corrigidos (1 marcado ⚠️ — valor arbitrário intencional)
✅ TypeScript: sem erros
✅ ESLint: sem erros
```
