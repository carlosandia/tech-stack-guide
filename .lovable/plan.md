
# Painel de Metricas para o Modulo de Emails

## Objetivo
Adicionar um botao "Metricas" na toolbar do modulo de Emails (mesmo padrao visual do modulo Conversas) que exibe/oculta um painel colapsavel com metricas de marketing e comerciais baseadas nos dados de emails enviados, aberturas, cliques, etc.

## Metricas a Exibir (10 cards)

| # | Metrica | Fonte de Dados | Cor Condicional |
|---|---------|----------------|-----------------|
| 1 | Emails Enviados | `emails_recebidos` pasta=sent no periodo | default |
| 2 | Emails Recebidos | `emails_recebidos` pasta=inbox no periodo | default |
| 3 | Taxa de Abertura | `total_aberturas > 0` / total enviados x 100 | verde >= 40%, amarelo >= 20%, vermelho < 20% |
| 4 | Total Aberturas | soma de `total_aberturas` dos enviados | default |
| 5 | Sem Resposta | enviados que nao tiveram resposta (sem thread_id match) | vermelho > 10, amarelo > 0, verde = 0 |
| 6 | Tempo Medio Resposta | diferenca media entre email recebido e resposta enviada | verde <= 30min, amarelo <= 2h, vermelho > 2h |
| 7 | Com Anexos | emails com `tem_anexos = true` no periodo | default |
| 8 | Favoritos | emails com `favorito = true` | default |
| 9 | Rascunhos | contagem de rascunhos ativos | default |
| 10 | Primeira Abertura (media) | tempo medio entre envio e primeira abertura (`aberto_em - data_email`) | verde <= 1h, amarelo <= 24h, vermelho > 24h |

## Arquivos a Criar

### 1. `src/modules/emails/hooks/useEmailsMetricas.ts`
- Hook com `useQuery` seguindo o padrao de `useConversasMetricas`
- Tipos: `PeriodoMetricas`, `EmailsMetricas`
- Funcao `fetchEmailsMetricas` que consulta `emails_recebidos` e `email_aberturas` via Supabase
- Filtros: periodo (hoje, 7d, 30d, 60d, 90d)
- Funcao auxiliar `formatDuracao` (reutilizar do modulo conversas ou duplicar)

### 2. `src/modules/emails/components/EmailsMetricasPanel.tsx`
- Componente visual identico ao `ConversasMetricasPanel`
- Grid responsivo: 2 cols mobile, 3 tablet, 5 desktop
- Filtro de periodo via chips
- Cards com icone, label, valor e cor condicional
- Animacao `animate-enter` e skeleton loading

## Arquivos a Modificar

### 3. `src/modules/emails/pages/EmailsPage.tsx`
- Adicionar estado `metricasVisiveis` com persistencia em `localStorage` (chave: `emails_metricas_visiveis`)
- Adicionar `toggleMetricas` callback
- Adicionar botao "Metricas" na toolbar (ao lado de "Assinatura"), mesmo estilo do Conversas
- Renderizar `<EmailsMetricasPanel />` condicionalmente acima do layout de 3 colunas

## Detalhes Tecnicos

### Hook `useEmailsMetricas`

```text
Query flow:
1. Obter usuario autenticado e organizacao_id
2. Contar emails enviados: pasta = 'sent', data_email >= dataInicio
3. Contar emails recebidos: pasta = 'inbox', data_email >= dataInicio
4. Taxa de abertura: enviados com total_aberturas > 0 / total enviados
5. Total aberturas: SUM(total_aberturas) dos enviados
6. Tempo medio resposta: calcular via threads (emails com mesmo thread_id)
7. Sem resposta: enviados sem reply no thread
8. Com anexos: tem_anexos = true
9. Favoritos: favorito = true
10. Rascunhos: contar de emails_rascunhos
11. Media primeira abertura: AVG(aberto_em - data_email) dos enviados com aberto_em != null
```

### Estrutura do painel (mesmo CSS do Conversas)
- Container: `border-b border-border bg-card/50 px-3 sm:px-4 py-3 animate-enter space-y-3`
- Chips periodo: `px-2.5 py-1 text-xs rounded-md font-medium`
- Grid: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2`
- Card: `flex items-center gap-2 px-2.5 py-2 rounded-lg`

### Botao na toolbar
- Mesmo estilo do Conversas: icone `BarChart3`, texto "Metricas"
- Toggle visual com `bg-primary/10 text-primary` quando ativo
- Posicionado antes do botao "Assinatura"
