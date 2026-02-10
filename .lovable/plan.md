
# Rodizio SLA com Countdown e Ajustes Visuais no Card

## Situacao Atual

1. **Rodizio**: Funciona apenas na CRIACAO da oportunidade (round-robin em `negocios.api.ts`). NAO existe nenhum mecanismo (cron, edge function, scheduler) que verifica periodicamente se o SLA expirou para redistribuir automaticamente.

2. **Timer no card**: Mostra tempo DECORRIDO estatico (ex: `55/30min`), calculado uma vez no render. Nao atualiza em tempo real (sem `setInterval`).

3. **Icones de acoes rapidas**: Tamanho `w-7 h-7` no botao e `w-4 h-4` no icone - um pouco grandes.

---

## O que sera implementado

### 1. Edge Function `processar-sla` (Backend)

Criar uma Edge Function que sera chamada periodicamente (via pg_cron ou externamente) para:

- Buscar todas as `configuracoes_distribuicao` onde `sla_ativo = true` e `modo = 'rodizio'`
- Para cada config, buscar oportunidades abertas onde `atualizado_em` excedeu o `sla_tempo_minutos`
- Contar redistribuicoes anteriores no `historico_distribuicao` (motivo = `'sla'`)
- Se abaixo do `sla_max_redistribuicoes`: redistribuir para proximo membro (round-robin), registrar no historico, atualizar `atualizado_em` (resetar timer)
- Se atingiu limite: aplicar `sla_acao_limite` (manter_ultimo / retornar_admin / desatribuir)

### 2. Cron Job via pg_cron

Agendar `pg_cron` para chamar a edge function `processar-sla` a cada 1 minuto (ou 5 minutos) via `pg_net`:

```text
SELECT cron.schedule(
  'processar-sla',
  '*/1 * * * *',
  $$ SELECT net.http_post(...) $$
);
```

### 3. Timer Countdown no Card (Frontend)

Alterar `KanbanCard.tsx` para mostrar contagem REGRESSIVA em tempo real:

- Usar `useState` + `useEffect` com `setInterval` de 1 segundo
- Calcular tempo RESTANTE: `sla_tempo_minutos * 60 - tempoDecorridoSegundos`
- Formato: `29:59` (minutos:segundos) diminuindo
- Quando chegar a 0, mostrar tempo negativo ou "Estourado"
- Manter cores: cinza (normal), amarelo (>= 80%), vermelho pulsante (>= 100%)

### 4. Tempo de Criacao Separado

Adicionar linha separada no card mostrando "ha X min" baseado em `criado_em` (nao `atualizado_em`), usando `formatDistanceToNow`.

### 5. Icones Menores nas Acoes Rapidas

Reduzir botoes de `w-7 h-7` para `w-6 h-6` e icones de `w-4 h-4` para `w-3.5 h-3.5`.

---

## Detalhes Tecnicos

### Edge Function `processar-sla`

**Arquivo:** `supabase/functions/processar-sla/index.ts`

Logica principal:
1. Autenticar via service_role key
2. Query: `configuracoes_distribuicao WHERE sla_ativo = true`
3. Para cada config, query: oportunidades abertas com `atualizado_em < NOW() - sla_tempo_minutos`
4. Para cada oportunidade excedida:
   - Contar registros em `historico_distribuicao` com `motivo = 'sla'` para aquela oportunidade
   - Se count < `sla_max_redistribuicoes`:
     - Buscar membros ativos do funil (via `funis_membros`)
     - Calcular proximo via round-robin (posicao_rodizio)
     - UPDATE oportunidade: `usuario_responsavel_id = novoMembro`, `atualizado_em = NOW()`
     - INSERT em `historico_distribuicao` com motivo `'sla'`
     - UPDATE `configuracoes_distribuicao` com nova posicao
   - Se count >= `sla_max_redistribuicoes`:
     - Aplicar `sla_acao_limite`

### Migracao SQL (pg_cron + pg_net)

```text
-- Habilitar extensoes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execucao a cada minuto
SELECT cron.schedule(
  'processar-sla-rodizio',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := '<SUPABASE_URL>/functions/v1/processar-sla',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### KanbanCard.tsx - Countdown Timer

Substituir o calculo estatico por um timer reativo:

```text
// Estado para countdown em tempo real
const [agora, setAgora] = useState(Date.now())

useEffect(() => {
  if (!slaAtivo) return
  const interval = setInterval(() => setAgora(Date.now()), 1000)
  return () => clearInterval(interval)
}, [slaAtivo])

// Calcular tempo restante (countdown)
const tempoDecorridoSeg = Math.floor((agora - new Date(oportunidade.atualizado_em).getTime()) / 1000)
const tempoTotalSeg = slaConfig.sla_tempo_minutos * 60
const tempoRestanteSeg = Math.max(0, tempoTotalSeg - tempoDecorridoSeg)
const minRestantes = Math.floor(tempoRestanteSeg / 60)
const segRestantes = tempoRestanteSeg % 60
const countdownText = tempoRestanteSeg > 0
  ? `${String(minRestantes).padStart(2, '0')}:${String(segRestantes).padStart(2, '0')}`
  : 'Estourado'
```

Layout do footer do card:
```text
// Linha 1: Countdown SLA (29:59) 
// Linha 2: "ha 6min" (tempo desde criacao)
```

### Reducao dos icones

No footer do card, alterar:
- Botao: `w-7 h-7` -> `w-6 h-6`
- Icone: `w-4 h-4` -> `w-3.5 h-3.5`

---

## Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/processar-sla/index.ts` | Criar edge function de redistribuicao |
| `supabase/migrations/xxx_cron_processar_sla.sql` | Criar cron job pg_cron |
| `src/modules/negocios/components/kanban/KanbanCard.tsx` | Countdown timer + tempo criacao + icones menores |
