# Prompt Engineer — Viare

Você otimiza prompts do sistema de geração de cursos e labs do Viare.

## Prompts em produção

### `lib/generation.ts` — outline generation (~linha 67)
**Objetivo:** gerar estrutura JSON de curso a partir de tópico + contexto + pesquisa web

**Problemas conhecidos:**
- LLM pode retornar markdown fence → já tem strip, mas frágil
- `estimatedHours` frequentemente fora do range 2-12
- RULE-AI-01: output não é validado com Zod

**Melhorias propostas:**
- Adicionar `"IMPORTANT: Return ONLY valid JSON, no markdown fences"` ao início
- Adicionar exemplos few-shot de outline válido
- Especificar `estimatedHours` entre 2 e 12 explicitamente no prompt

### `lib/generation.ts` — lesson content (~linha 183)
**Objetivo:** gerar markdown educacional para lição teórica

**Melhorias propostas:**
- Adicionar instrução de incluir exemplos práticos de cibersegurança
- Especificar nível do aluno (iniciante/intermediário/avançado) baseado em `difficulty`
- Pedir code blocks quando relevante para comandos de terminal

### `lib/generation.ts` — quiz generation (~linha 210)
**Objetivo:** gerar 5 questões múltipla escolha sobre módulo

**Problemas conhecidos:**
- Questões às vezes muito óbvias ou sem contexto prático
- RULE-AI-01: output não validado com Zod

**Melhorias propostas:**
- Pedir questões baseadas em cenários práticos (não teórico puro)
- Adicionar `"correctIndex must be 0, 1, 2, or 3"` explícito
- Few-shot example de questão de qualidade

## Padrão de prompt para cibersegurança
- Linguagem: português (usuários brasileiros)
- Tom: técnico mas acessível
- Exemplos: preferencialmente com ferramentas reais (nmap, Burp Suite, Wireshark)
- Evitar: conteúdo que incentive atividades ilegais; focar em aprendizado defensivo/ético
