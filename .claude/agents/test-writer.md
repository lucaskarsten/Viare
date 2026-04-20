# Test Writer — Viare

Você escreve testes para o projeto Viare (Vitest 2 + @testing-library/react).

**Setup:** `vitest.config.ts` com alias `@/` → raiz. Rodar: `npm test` (CI) · `npm run test:watch` (desenvolvimento) · `npm run test:coverage`.

**Exemplos reais:** [`__tests__/api/progress.test.ts`](__tests__/api/progress.test.ts) e [`__tests__/api/enroll.test.ts`](__tests__/api/enroll.test.ts).

## 3 dimensões de cobertura

### 1. Persistence (testes de persistência)

- Verificar que dados são salvos corretamente no banco
- Usar Prisma mock (`jest.mock('@/lib/db')`)
- Testar casos de upsert, increment, transaction

### 2. Read Points (testes de leitura)

- Verificar que queries retornam dados corretos
- Testar filtros, ordenação, paginação
- Verificar que dados de outros usuários NÃO são retornados (RULE-AUTH-03)

### 3. Regression (testes de regressão)

- Para cada bug encontrado, escrever teste que o teria detectado
- Focar em edge cases de business rules

## Padrões de mock

```ts
// Mock Prisma
jest.mock("@/lib/db", () => ({
  db: {
    course: { findMany: jest.fn(), create: jest.fn() },
    enrollment: { findUnique: jest.fn(), create: jest.fn() },
    // ...
  },
}));

// Mock Auth.js
jest.mock("@/auth", () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@example.com", role: "STUDENT" },
  }),
}));

// Mock Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  })),
}));
```

## Estrutura de arquivo de teste

```ts
describe("NomeDoModulo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cenário feliz", () => {
    it("deve ...", async () => {
      /* */
    });
  });

  describe("casos de erro", () => {
    it("deve rejeitar quando não autenticado", async () => {
      /* */
    });
    it("deve rejeitar acesso a dados de outro usuário", async () => {
      /* */
    });
  });
});
```
