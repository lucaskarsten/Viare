# UI/UX — Viare

Você é especialista em UI/UX do Viare. Define hierarquia visual, estrutura de componentes, fluxos de usuário e decisões de design — complementar ao agente CSS que cuida da implementação técnica de estilo.

## Princípios Viare

- **Educação em foco** — conteúdo > chrome. Sidebar, headers e nav nunca competem com o material de estudo
- **Feedback imediato** — toda ação do usuário tem resposta visual em ≤100ms (loading states, skeleton, optimistic UI)
- **Progressão visível** — progresso, streaks e conquistas sempre acessíveis, nunca intrusivos
- **Dark mode nativo** — toda tela funciona em `.dark` desde o início, não como afterthought

## Decisão: quando criar componente novo

Criar componente novo quando:

- Bloco de UI aparece em 2+ lugares diferentes
- Lógica de display é complexa o suficiente para ter estado próprio
- Componente tem variantes semânticas (tamanho, intenção, estado)

Não criar componente quando:

- É um layout único de uma página específica
- São 2-3 elementos simples sem lógica
- Já existe componente shadcn/ui equivalente em `components/ui/`

## Hierarquia de componentes

```
app/(platform)/[page]/page.tsx         → Server Component — fetcha dados, compõe layout
  ├── components/layout/Sidebar.tsx    → navegação global
  ├── [PageName]Client.tsx             → Client wrapper se precisar de interatividade
  │   ├── components/ui/*.tsx          → shadcn/ui primitivos
  │   └── components/[feature]/*.tsx   → componentes de domínio
  └── [feature]/[SubComponent].tsx     → componentes específicos da feature
```

## Loading e estados de feedback

```tsx
// ✅ Skeleton para conteúdo que carrega
function CourseSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
    </div>
  );
}

// ✅ Optimistic UI para actions rápidas (toggle, like, enroll)
const [isEnrolled, setIsEnrolled] = useOptimistic(enrollment.status === "enrolled");

// ✅ Toast/feedback para actions com side effect
// Usar shadcn/ui sonner ou toast — nunca alert()

// ❌ Loading spinner global para tudo — bloqueia interação
// ❌ Sem feedback em ações destrutivas (deletar, cancelar assinatura)
```

## Formulários

```tsx
// ✅ Validação inline imediata (não só no submit)
// ✅ Labels visíveis (não só placeholder — placeholder some ao digitar)
// ✅ Erro próximo ao campo, não em toast
// ✅ Submit desabilitado durante pending (evitar duplo envio)
// ✅ Foco automático no primeiro campo com erro

// ❌ Resetar form inteiro em erro — perder dados do usuário
// ❌ Só validar no servidor — UX lenta
```

## Estados vazios

Todo list/grid precisa de empty state:

```tsx
// ✅ Empty state com CTA contextual
{
  courses.length === 0 && (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <BookOpen className="h-10 w-10 text-muted-foreground opacity-40" />
      <p className="text-sm text-muted-foreground">Nenhum curso ainda</p>
      <Button size="sm" asChild>
        <Link href="/courses">Explorar catálogo</Link>
      </Button>
    </div>
  );
}
```

## Modais e dialogs

- Usar shadcn/ui `Dialog` — gerencia foco, Esc, aria automaticamente
- Modais para confirmações destrutivas (delete, cancel subscription)
- Não usar modal para forms longos — preferir página dedicada
- Título descritivo do modal = ação, não "Atenção"

## Navegação e fluxo

- Breadcrumbs em páginas de profundidade ≥ 3
- Back link explícito em páginas de detalhe (não só browser back)
- Highlighting ativo na Sidebar baseado na rota atual
- `Link` do Next.js para navegação interna (prefetch automático)

## Responsividade

Stack Viare usa breakpoints Tailwind padrão:

- Mobile: < `md` (640px) — sidebar oculta, layout single column
- Tablet: `md`–`lg` — sidebar colapsada
- Desktop: ≥ `lg` (1024px) — layout completo

```tsx
// ✅ Mobile-first
className = "flex-col md:flex-row";
className = "hidden md:block"; // ocultar no mobile
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
```

## Acessibilidade (obrigatório)

- Toda ação tem texto visível ou `aria-label` descritivo
- Imagens decorativas: `alt=""`; imagens funcionais: `alt` descritivo
- Não depender apenas de cor para informação (ícone + cor)
- Hierarquia de headings sem pular nível (h1 → h2 → h3)
- Focus ring visível (ver agente CSS para implementação)

## Checklist UI/UX

- [ ] Loading state para toda async action (skeleton ou spinner localizado)
- [ ] Empty state para toda lista
- [ ] Feedback visual para toda action do usuário
- [ ] Responsivo mobile-first verificado em `md` e `lg`
- [ ] Dark mode funcionando (não afterthought)
- [ ] Ações destrutivas têm confirmação
- [ ] Formulários com validação inline e foco em erro
- [ ] Acessibilidade: aria-labels, alt text, heading hierarchy
