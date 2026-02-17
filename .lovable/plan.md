
# Plano de Correcao - Metricas de Conversas

## Problemas Identificados

### 1. Bug Critico: Limite de 1000 linhas do Supabase (Enviadas/Recebidas incorretas)
- O Supabase limita queries a 1000 linhas por padrao
- A query de mensagens busca em batches de 50 conversas, mas cada batch pode retornar +1000 mensagens
- **Dados reais**: DB tem 2660 mensagens em 30 dias (1182 enviadas, 1648 recebidas)
- **Tela mostra**: 295 enviadas, 428 recebidas (dados truncados)
- **Impacto**: TMR, TMA, Sem Resposta tambem estao incorretos pois dependem das mensagens

### 2. Filtro de tipo de conversa ausente
- A query de conversas nao exclui `tipo = 'grupo'` (35 grupos incluidos indevidamente)
- Total Conversas mostra 360, deveria ser ~325 (somente individuais)

### 3. Taxa de Resolucao sempre 0%
- O hook so verifica `status = 'fechada'`, mas o DB tambem tem status `resolvida`
- Ambos os status devem contar para resolucao

### 4. Sem Resposta com logica incompleta
- So conta conversas com ultima mensagem do cliente ha mais de 2h
- Deveria tambem contar conversas sem nenhuma resposta (sem nenhum `from_me`)

### 5. Filtro de periodo "Personalizado" ausente
- Usuarios nao conseguem selecionar datas especificas

---

## Plano de Implementacao

### Etapa 1: Corrigir busca de mensagens (bug do limite 1000)
**Arquivo**: `src/modules/conversas/hooks/useConversasMetricas.ts`

Em vez de buscar todas as mensagens e calcular no frontend (ineficiente e limitado), refatorar para usar **queries de contagem** no Supabase:

- **Enviadas/Recebidas**: Usar `count: 'exact'` com filtro `from_me` direto no Supabase, sem buscar linhas
- **TMR/TMA**: Manter busca por mensagens mas com `.limit(10000)` e batches menores (20 conversas por vez) para evitar truncamento
- **Sem Resposta**: Usar query SQL separada contando conversas sem `from_me`

### Etapa 2: Adicionar filtro `tipo != 'grupo'`
**Arquivo**: `src/modules/conversas/hooks/useConversasMetricas.ts`

Adicionar `.eq('tipo', 'individual')` na query de conversas para excluir grupos e canais.

### Etapa 3: Corrigir Taxa de Resolucao
**Arquivo**: `src/modules/conversas/hooks/useConversasMetricas.ts`

Alterar de:
```
conversasList.filter(c => c.status === 'fechada')
```
Para:
```
conversasList.filter(c => c.status === 'fechada' || c.status === 'resolvida')
```

### Etapa 4: Corrigir logica de "Sem Resposta"
**Arquivo**: `src/modules/conversas/hooks/useConversasMetricas.ts`

Incluir conversas que:
- Ultima mensagem e do cliente ha mais de 2h (atual)
- **OU** nao possuem nenhuma mensagem `from_me` (nunca respondidas)

### Etapa 5: Adicionar filtro "Personalizado"
**Arquivos**:
- `src/modules/conversas/hooks/useConversasMetricas.ts` - Adicionar tipo `'custom'` ao `PeriodoMetricas` com `dataInicio` e `dataFim`
- `src/modules/conversas/components/ConversasMetricasPanel.tsx` - Adicionar botao "Personalizado" que abre um date range picker com dois inputs de data

### Etapa 6: Ajustes visuais no painel
**Arquivo**: `src/modules/conversas/components/ConversasMetricasPanel.tsx`

- Usar icones dedicados para WhatsApp e Instagram nos cards (em vez do generico `BarChart3`)
- Seguir design system para espacamentos e tipografia

---

## Secao Tecnica

### Estrategia para contornar limite de 1000 linhas

A abordagem sera hibrida:

1. **Contagens simples** (enviadas, recebidas, com anexos): usar `select('id', { count: 'exact', head: true })` que retorna apenas o count sem dados
2. **Calculos que precisam de dados** (TMR, TMA): buscar mensagens com `.limit(5000)` em batches de 10 conversas por vez, garantindo que cada batch retorne poucos registros
3. **Sem Resposta**: query separada que busca somente a ultima mensagem de cada conversa

### Tipo PeriodoMetricas atualizado
```typescript
type PeriodoMetricas = 'hoje' | '7d' | '30d' | '60d' | '90d' | 'custom'

interface MetricasFilters {
  periodo: PeriodoMetricas
  canal: CanalFiltro
  vendedorId?: string
  dataInicio?: string  // ISO string para periodo custom
  dataFim?: string     // ISO string para periodo custom
}
```

### Tabelas e colunas validadas
- `conversas.canal` = 'whatsapp' | 'instagram' -- OK, filtro funciona
- `conversas.tipo` = 'individual' | 'grupo' -- **falta filtro**
- `conversas.status` = 'aberta' | 'fechada' | 'resolvida' -- **falta 'resolvida'**
- `conversas.usuario_id` -- OK para filtro por vendedor
- `mensagens.from_me` -- OK
- `mensagens.criado_em` -- OK para periodos
- `conversas.primeira_mensagem_em` / `status_alterado_em` -- OK para tempo resolucao
