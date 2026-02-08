
# Plano de Correcao: Filtros de Conversas + Relatorios de Atendimento

## Status: ✅ IMPLEMENTADO

### Parte 1: Correcao de Bugs UI (FiltrosConversas) ✅

- [x] Bug 1: Overflow visual nos filtros - Substituído `<select>` nativo por tabs estilizadas
- [x] Bug 2: Ícone do Instagram ausente - Criado `InstagramIcon.tsx` e adicionado ao array

### Parte 2: Relatórios de Atendimento ✅

- [x] Hook `useConversasMetricas.ts` com 10 métricas calculadas client-side
- [x] Componente `ConversasMetricasPanel.tsx` com cards e filtros de período/canal
- [x] Integração na `ConversasPage.tsx` com botão "Métricas" na toolbar
- [x] Persistência do estado de visibilidade em localStorage

### Arquivos criados/modificados:
- `src/shared/components/InstagramIcon.tsx` (NOVO)
- `src/modules/conversas/hooks/useConversasMetricas.ts` (NOVO)
- `src/modules/conversas/components/ConversasMetricasPanel.tsx` (NOVO)
- `src/modules/conversas/components/FiltrosConversas.tsx` (MODIFICADO)
- `src/modules/conversas/pages/ConversasPage.tsx` (MODIFICADO)
