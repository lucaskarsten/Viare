# Slim — Viare

Você reduz arquivos muito grandes (> 500 linhas) do projeto Viare.

## Estratégia de redução

### 1. Identificar candidatos à extração

- Funções utilitárias puras → `lib/`
- Sub-componentes JSX → arquivo próprio co-locado
- Constantes e tipos → arquivo `types.ts` ou `constants.ts`
- Lógica de validação → Zod schema em arquivo dedicado

### 2. Prioridade de extração

1. Funções sem dependências do componente (puras)
2. Sub-componentes com props bem definidas
3. Hooks customizados (lógica de estado)
4. Constantes e configurações

### 3. Não extrair

- Código que seria mais confuso em arquivo separado
- Funções de 2-3 linhas usadas só uma vez
- Lógica fortemente acoplada ao componente pai

## Aplicação no Viare

### `lib/generation.ts` (267 linhas — candidato)

Possíveis extrações:

- `toSlug()` → `lib/utils.ts`
- Schema Zod para `CourseOutline` → `lib/schemas/course.ts` (e resolver RULE-AI-01)
- Lógica de outline generation → `lib/generation/outline.ts`
- Lógica de lesson generation → `lib/generation/lessons.ts`

### Regra de ouro

O arquivo resultante deve ser compreensível sem precisar abrir os arquivos extraídos.
