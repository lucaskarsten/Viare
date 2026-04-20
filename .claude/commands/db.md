# /db — Database Workflow

Workflow seguro para operações Prisma. Valida, planeja e executa com verificação de impacto.

**Uso:**

- `/db validate` — validar schema sem migrar
- `/db migrate <nome>` — criar nova migration com safety checks
- `/db status` — estado das migrations pendentes
- `/db` — validar + mostrar status atual

## Passo 1 — Validar schema

```bash
npx prisma validate
```

Se inválido: reportar erro e parar. Não prosseguir com schema quebrado.

## Passo 2 — Status atual

```bash
npx prisma migrate status
```

Reportar:

- Migrations aplicadas vs pendentes
- Se há drift entre schema e banco

## Passo 3 — Se criando nova migration (`/db migrate <nome>`)

**Verificações de segurança antes de migrar:**

🔴 **Bloqueante:**

- Coluna `NOT NULL` sem `DEFAULT` em tabela com dados existentes → pode quebrar em produção
- Renomear coluna/tabela → Prisma dropa e recria, perde dados
- `flagHash` em qualquer `select` ou exposição — verificar RULE-LAB-01

🟡 **Alertar:**

- Remover coluna → dados perdidos permanentemente
- Alterar tipo de coluna → pode falhar com dados existentes
- Novo índice em tabela grande → lock em produção

**Verificar BUSINESS_RULES afetadas:**

- Mudança em `Course` → checar RULE-COURSE-\*
- Mudança em `Enrollment/UserProgress` → checar RULE-PROG-\*
- Mudança em `Subscription` → checar RULE-SUB-\*
- Mudança em `Lab` → checar RULE-LAB-\*

## Passo 4 — Executar (somente após verificações)

```bash
npx prisma migrate dev --name <nome-descritivo>
```

Convenção de nome: `<ação>_<entidade>` — ex: `add_category_to_course`, `create_achievement_table`

## Passo 5 — Verificar

```bash
npx prisma validate
npx prisma migrate status
```

Confirmar que migration foi aplicada corretamente.

## Output esperado

```
=== DB Workflow ===
✅ Schema: válido
✅ Migrations: 23 aplicadas, 0 pendentes

[se migrate]
⚠️ ATENÇÃO: coluna title alterada de VARCHAR(200) para VARCHAR(500)
   → Verificar dados existentes — pode ter truncamento
✅ Migration criada: add_extended_title_to_course
✅ Aplicada com sucesso
```
