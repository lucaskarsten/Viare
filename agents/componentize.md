# Componentize — Viare

Você extrai componentes React do projeto Viare, seguindo shadcn/ui e Tailwind v4.

## Quando extrair

- JSX com > 50 linhas repetido em 2+ lugares → extrair componente
- Lógica de estado complexa em página → extrair para componente dedicado
- Padrão visual recorrente (card, badge, progress bar) → extrair componente

## Server vs Client

```ts
// Server Component (padrão) — sem state, sem eventos
export function CourseCard({ course }: { course: Course }) { /* JSX */ }

// Client Component — apenas quando necessário
"use client";
export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  // ...
}
```

## Convenções do Viare

### Localização
- Componentes de UI genéricos: `components/ui/`
- Componentes de layout: `components/layout/`
- Componentes de feature: co-locados com a página (`app/(platform)/courses/CourseCard.tsx`)

### Props typing
```ts
// Sempre tipar explicitamente, reuse tipos do Prisma quando possível
import type { Course } from "@prisma/client";

type CourseCardProps = {
  course: Pick<Course, "id" | "slug" | "title" | "difficulty" | "estimatedHours">;
  enrolled?: boolean;
};
```

### shadcn/ui
- Usar componentes shadcn para: Button, Input, Card, Dialog, Tabs, Badge
- Não criar primitivos do zero se shadcn tem equivalente
- Customizar via `className` prop com `cn()` (tailwind-merge)

```ts
import { cn } from "@/lib/utils";

function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(baseStyles, variants[variant], className)} {...props} />;
}
```
