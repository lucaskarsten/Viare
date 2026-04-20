# /learn — Extrair conhecimento e atualizar regras

Analise o trabalho realizado nesta sessão e extraia conhecimento estruturado.

## Formato de output (6 seções)

### 1. Resumo técnico

O que foi implementado, em 3-5 bullets concisos.

### 2. Decisões de design

Decisões não-óbvias tomadas e os trade-offs considerados.

### 3. Padrões identificados

Padrões de código recorrentes no projeto que devo seguir.

### 4. Armadilhas encontradas

Bugs, erros ou surpresas que encontrei e como foram resolvidos.

### 5. Regras de negócio implícitas (LL-NN)

Regras descobertas durante a implementação que deveriam estar no BUSINESS_RULES.md.
Formato: `LL-NN: <descrição da regra>`

### 6. Sugestões para BUSINESS_RULES.md

Para cada LL-NN identificado, propor a adição no BUSINESS_RULES.md com:

- Domínio (AUTH/COURSE/AI/SUB/PROG/LAB)
- ID sugerido
- Texto da regra
- Exemplo de código com anchor comment

## Paths relevantes para análise

- `app/api/` — Route Handlers
- `lib/` — lógica de domínio
- `prisma/schema.prisma` — schema
- `app/(platform)/` — páginas autenticadas
