
# Plano de Correcao: Filtros de Conversas + Relatorios de Atendimento

## Parte 1: Correcao de Bugs UI (FiltrosConversas)

### Bug 1: Overflow visual nos filtros

**Problema:** A area de filtros mostra os tabs de canal (Todas, WhatsApp, Instagram) e um `<select>` de status ("Todas" + chevron) lado a lado em uma unica linha. O `<select>` HTML nativo nao segue o Design System e o chevron do select cria confusao visual, parecendo que a lista esta "vazando" para fora do container.

**Causa raiz:** O layout mistura tabs com select nativo na mesma linha sem separacao visual adequada. O separador (`w-px h-4 bg-border`) e discreto demais e o select nativo nao tem estilizacao consistente.

**Correcao:**
- Substituir o `<select>` HTML nativo por tabs estilizadas para status, igual ao padrao ja usado para canais
- Reorganizar o layout: canal tabs na primeira linha, status tabs na segunda linha (ou na mesma linha com separacao clara)
- Adicionar `overflow-hidden` e `flex-wrap` no container para evitar vazamento visual

### Bug 2: Icone do Instagram ausente

**Problema:** No array `canais` (linha 21 de FiltrosConversas.tsx), o item Instagram nao possui propriedade `icon`. O WhatsApp tem `<WhatsAppIcon>` mas Instagram esta sem icone.

**Correcao:** Criar componente `InstagramIcon` (SVG oficial do Instagram) em `src/shared/components/InstagramIcon.tsx`, seguindo o mesmo padrao do `WhatsAppIcon.tsx`. Usar a cor oficial do Instagram (gradiente ou roxo `#E4405F`). Adicionar o icone no array `canais`.

### Arquivos a modificar (Parte 1):
1. **`src/shared/components/InstagramIcon.tsx`** - NOVO: Componente SVG do Instagram
2. **`src/modules/conversas/components/FiltrosConversas.tsx`** - Importar InstagramIcon, adicionar ao array, refatorar layout dos filtros

---

## Parte 2: Relatorios de Atendimento (Feature Nova)

### Metricas Propostas

Baseado na sua necessidade principal (tempo de resposta) e nas melhores praticas de SaaS de atendimento, proponho **10 metricas** organizadas em 3 categorias:

#### Categoria 1: Velocidade de Atendimento
| Metrica | Descricao | Calculo |
|---------|-----------|---------|
| **Tempo Medio de Primeira Resposta (TMR)** | Quanto tempo leva para o vendedor enviar a primeira mensagem apos receber uma do cliente | Media de (timestamp 1a resposta `from_me=true` - timestamp 1a mensagem `from_me=false`) por conversa |
| **Tempo Medio de Resposta (TMA)** | Media de todas as interacoes, nao so a primeira | Para cada mensagem do cliente, mede o tempo ate a proxima resposta do vendedor |
| **Conversas sem Resposta** | Conversas que receberam mensagem do cliente mas nao tiveram resposta em X horas | Contagem de conversas com ultima mensagem `from_me=false` ha mais de N horas |

#### Categoria 2: Volume e Produtividade
| Metrica | Descricao | Calculo |
|---------|-----------|---------|
| **Total de Conversas** | Volume total no periodo filtrado | Count de conversas com atividade no periodo |
| **Mensagens Enviadas/Recebidas** | Volume de mensagens por direcao | Count de mensagens agrupadas por `from_me` |
| **Conversas por Vendedor** | Distribuicao de carga entre a equipe | Count de conversas agrupadas por `usuario_id` |
| **Taxa de Resolucao** | % de conversas marcadas como "fechada" no periodo | (Conversas fechadas / Total conversas) * 100 |

#### Categoria 3: Qualidade e Conversao
| Metrica | Descricao | Calculo |
|---------|-----------|---------|
| **Tempo Medio de Resolucao** | Tempo entre abertura e fechamento da conversa | Media de (`status_alterado_em` quando status=fechada - `primeira_mensagem_em`) |
| **Taxa de Conversao (Conversa -> Oportunidade)** | % de conversas que geraram oportunidade | Conversas que tiveram oportunidade criada / Total de conversas |
| **Conversas por Canal** | Distribuicao WhatsApp vs Instagram | Count agrupado por `canal` |

### Arquitetura da Feature

A feature sera implementada como um painel colapsavel abaixo da toolbar (mesmo padrao do MetricasPanel do modulo de Negocios), acessivel via botao na toolbar do AppLayout.

**Componentes novos:**
1. **`ConversasMetricasPanel.tsx`** - Painel de cards com as metricas calculadas
2. **`ConversasRelatorioPage.tsx`** - Pagina dedicada para relatorios detalhados (futuro, V2)

**Dados disponiveis no banco:**
- Tabela `mensagens`: `from_me`, `criado_em`, `conversa_id` - permite calcular tempos de resposta
- Tabela `conversas`: `status`, `status_alterado_em`, `primeira_mensagem_em`, `ultima_mensagem_em`, `canal`, `usuario_id` - permite calcular resolucao, volume, distribuicao

### Visibilidade por Role
- **Admin**: Ve metricas de todos os vendedores (global do tenant)
- **Member**: Ve apenas suas proprias metricas

### Filtros do Painel
- Periodo: Hoje, 7 dias, 30 dias, 60 dias, 90 dias
- Canal: Todos, WhatsApp, Instagram
- Vendedor: Todos (admin only), vendedor especifico

---

## Secao Tecnica

### Arquivo: `src/shared/components/InstagramIcon.tsx` (NOVO)

Componente SVG com a mesma interface do WhatsAppIcon (props: `size`, `className`). Usa o path SVG oficial do logo Instagram.

### Arquivo: `src/modules/conversas/components/FiltrosConversas.tsx`

Mudancas:
- Importar `InstagramIcon` e adicionar ao item Instagram no array `canais`
- Substituir `<select>` nativo por tabs estilizadas para status (mesmo padrao visual dos tabs de canal)
- Reorganizar layout: canal tabs + separador + status tabs (tudo na mesma linha com `flex-wrap` para mobile)
- Adicionar `overflow-hidden` no container pai

### Arquivo: `src/modules/conversas/components/ConversasMetricasPanel.tsx` (NOVO)

Componente de metricas com:
- Cards compactos seguindo Design System (rounded-lg, shadow-sm, cores semanticas)
- Calculo client-side das metricas a partir de queries Supabase
- Filtro de periodo integrado (chips: 7d, 30d, 60d, 90d)
- Layout responsivo: 2 colunas no mobile, 3 no tablet, 5 no desktop

### Arquivo: `src/modules/conversas/hooks/useConversasMetricas.ts` (NOVO)

Hook com queries Supabase para:
- Buscar mensagens do periodo filtrado com `from_me` e `criado_em`
- Buscar conversas com status e timestamps
- Calcular todas as 10 metricas client-side
- Cache via TanStack Query com `staleTime: 5min`

### Arquivo: `src/modules/conversas/pages/ConversasPage.tsx`

Mudancas:
- Adicionar botao de metricas (icone BarChart3) no toolbar via `setActions`
- Estado `metricasVisiveis` com persistencia em localStorage
- Renderizar `ConversasMetricasPanel` condicionalmente acima do split-view

### Sequencia de Implementacao

1. `InstagramIcon.tsx` - Componente SVG (sem dependencia)
2. `FiltrosConversas.tsx` - Correcao de overflow + icone Instagram
3. `useConversasMetricas.ts` - Hook de dados
4. `ConversasMetricasPanel.tsx` - UI das metricas
5. `ConversasPage.tsx` - Integracao do painel + botao na toolbar
