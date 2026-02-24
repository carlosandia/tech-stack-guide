
# Correção: Etapas do header ocupando todo espaço disponível

## Problema

No header do modal de detalhes da oportunidade, o container do título tem `flex-1` e ocupa espaço desnecessário, empurrando as etapas para um espaço reduzido. As etapas ficam cortadas com scroll horizontal mesmo quando há espaço sobrando no header.

## Correção

**Arquivo**: `src/modules/negocios/components/detalhes/DetalhesHeader.tsx`

Alteração pontual em 2 classes CSS:

1. **Título** (linha 36): Trocar `flex-1` por `flex-shrink-0` -- o título deve ocupar apenas o espaço necessário, sem expandir
2. **Stepper** (linha 48): Manter `flex-1` para que as etapas preencham todo o espaço restante. O `overflow-x-auto` já garante scroll apenas quando realmente ultrapassar

| Linha | De | Para |
|-------|----|------|
| 36 | `flex items-center gap-2 min-w-0 flex-1` | `flex items-center gap-2 flex-shrink-0` |

Isso faz com que o título ocupe só o necessário e as etapas expandam para todo o espaço livre, aplicando scroll horizontal apenas quando realmente não couber.
