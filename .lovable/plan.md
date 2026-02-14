
# Correção: Rodízio SLA redistribuindo infinitamente

## Problema Raiz

A edge function `processar-sla/index.ts` insere registros na tabela `historico_distribuicao` usando nomes de colunas **incorretos**:

- Usa `usuario_origem_id` mas a coluna real é `usuario_anterior_id`
- Usa `usuario_destino_id` mas a coluna real é `usuario_novo_id`
- Usa `funil_id` mas essa coluna **não existe** na tabela

Como o insert falha silenciosamente (sem try/catch nesse trecho), o contador de redistribuições por SLA (`count where motivo='sla'`) retorna sempre 0. Resultado: o limite de 3 redistribuições nunca é atingido e o rodízio continua para sempre.

Evidência do audit_log: a oportunidade "Regiane - #1" foi redistribuída **dezenas de vezes** desde as 02:30 do dia 13/02, alternando entre os 2 vendedores a cada 30 minutos.

**Nota importante:** O sistema NÃO está criando novas oportunidades. As oportunidades "Teste - #2" e "Teste - #3" foram criadas manualmente. O bug real é que o rodízio nunca para de redistribuir a mesma oportunidade.

## Correção

### Arquivo: `supabase/functions/processar-sla/index.ts` (linhas 204-211)

Corrigir os nomes das colunas no insert do historico_distribuicao:

De:
```typescript
await supabase.from('historico_distribuicao').insert({
  organizacao_id: config.organizacao_id,
  oportunidade_id: op.id,
  funil_id: config.funil_id,          // coluna inexistente
  usuario_origem_id: responsavelAtual, // nome errado
  usuario_destino_id: proximoUsuarioId, // nome errado
  motivo: 'sla',
})
```

Para:
```typescript
await supabase.from('historico_distribuicao').insert({
  organizacao_id: config.organizacao_id,
  oportunidade_id: op.id,
  usuario_anterior_id: responsavelAtual,
  usuario_novo_id: proximoUsuarioId,
  motivo: 'sla',
})
```

### Após o deploy

O historico_distribuicao passará a registrar corretamente cada redistribuição por SLA. Quando o contador atingir o limite configurado (3), o rodízio parará conforme esperado, aplicando a ação configurada ("Manter com último vendedor").
