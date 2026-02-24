

# Correção: Histórico de "Oportunidade fechada" não registra em re-fechamentos

## Diagnóstico

O problema está na **trigger do banco de dados** que registra o evento de fechamento. A condição atual é:

```sql
IF OLD.fechado_em IS NULL AND NEW.fechado_em IS NOT NULL THEN
  -- registra "fechamento" no audit_log
```

Isso significa que o evento só é registrado quando `fechado_em` passa de NULL para um valor. No cenário reportado:

1. **Normal -> Ganho**: `fechado_em` era NULL, vira timestamp -- trigger dispara "Oportunidade fechada" (correto)
2. **Ganho -> Perdido**: `fechado_em` já tinha valor, recebe novo timestamp -- trigger **NÃO** dispara (bug)
3. **Perdido -> Ganho**: Mesma situação -- trigger **NÃO** dispara (bug)

Além disso, há outro gap: ao mover de Ganho/Perdido de volta para uma etapa normal (ex: "Contatar hoje"), o `fechado_em` permanece preenchido, o que é semanticamente incorreto -- a oportunidade deveria voltar a ficar "aberta".

## Plano de Correção

### 1. Frontend: `fecharOportunidade` faz reset antes de fechar (workaround imediato)

**Arquivo**: `src/modules/negocios/services/negocios.api.ts`

Na função `fecharOportunidade` (linha 598-616), antes de fazer o update com o novo `fechado_em`, primeiro limpar o campo para NULL e depois setar o novo valor. Isso garante que a trigger detecte a transição NULL -> timestamp:

```typescript
// Primeiro: limpar fechado_em para garantir que a trigger detecte
await supabase
  .from('oportunidades')
  .update({ fechado_em: null } as any)
  .eq('id', oportunidadeId)

// Depois: setar os dados reais
await supabase
  .from('oportunidades')
  .update({
    etapa_id: etapaDestinoId,
    motivo_resultado_id: motivoId || null,
    observacoes: observacoes || null,
    fechado_em: new Date().toISOString(),
  } as any)
  .eq('id', oportunidadeId)
```

### 2. Frontend: `moverEtapa` limpa `fechado_em` ao mover para etapa normal

**Arquivo**: `src/modules/negocios/services/negocios.api.ts`

Na função `moverEtapa` (linha 465-522), ao mover para qualquer etapa, limpar `fechado_em` e `motivo_resultado_id` para que a oportunidade volte ao estado "aberta":

```typescript
// Linha 474-477: adicionar fechado_em: null e motivo_resultado_id: null
const { error } = await supabase
  .from('oportunidades')
  .update({
    etapa_id: etapaDestinoId,
    fechado_em: null,
    motivo_resultado_id: null,
  } as any)
  .eq('id', oportunidadeId)
```

Isso é seguro porque `moverEtapa` só é chamado para etapas normais (entrada/normal). Para ganho/perda, o fluxo passa por `fecharOportunidade`.

### Resumo das alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/negocios/services/negocios.api.ts` | `fecharOportunidade`: reset `fechado_em` para NULL antes de re-fechar |
| `src/modules/negocios/services/negocios.api.ts` | `moverEtapa`: limpar `fechado_em` e `motivo_resultado_id` ao mover para etapa normal |

Nenhuma alteração de migration/trigger necessária -- o fix é inteiramente no frontend.

