
# Vinculação Automática de Contatos na Sincronização de Emails

## Problema Identificado

A busca do `ContatoCard` está **tecnicamente correta** — ela procura por `contato_id` primeiro e depois por email exato na tabela `contatos`. O problema real é que:

1. **O sync de emails (`sync-emails`) nunca popula o campo `contato_id`** — ao inserir novos emails, o campo fica sempre `null`
2. O fallback por email funciona, mas depende de match exato entre `de_email` do email e `email` do contato
3. Nenhum email no banco tem `contato_id` preenchido (confirmado via consulta)

Exemplo: o email do eKyte (`notification@email.ekyte.com`) corretamente mostra "não encontrado" porque esse endereço não existe nos contatos. Porém, se um email vier de `djavan.mcd@gmail.com` (que existe nos contatos), o ContatoCard **já encontra** via fallback — mas sem o vínculo direto no `contato_id`.

## Solução

### 1. Auto-vinculação no `sync-emails` (Edge Function)

Após montar o array `toInsert` e antes do insert no banco, adicionar uma etapa que:
- Coleta todos os `de_email` únicos dos emails a inserir
- Faz uma query batch nos contatos: `SELECT id, email FROM contatos WHERE email IN (...) AND deletado_em IS NULL AND organizacao_id = ?`
- Cria um mapa `email -> contato_id`
- Preenche o `contato_id` de cada email no `toInsert` quando houver match

**Arquivo:** `supabase/functions/sync-emails/index.ts`

Trecho a adicionar (após linha ~876, antes do batch insert):

```typescript
// Auto-vincular contatos por email
if (toInsert.length > 0) {
  const uniqueEmails = [...new Set(toInsert.map(e => e.de_email).filter(Boolean))]
  
  if (uniqueEmails.length > 0) {
    const { data: contatos } = await supabaseAdmin
      .from('contatos')
      .select('id, email')
      .in('email', uniqueEmails)
      .eq('organizacao_id', usuario.organizacao_id)
      .is('deletado_em', null)
    
    if (contatos && contatos.length > 0) {
      const emailToContato = new Map(contatos.map(c => [c.email.toLowerCase(), c.id]))
      
      for (const email of toInsert) {
        const contatoId = emailToContato.get((email.de_email as string).toLowerCase())
        if (contatoId) {
          email.contato_id = contatoId
        }
      }
      
      console.log(`[sync-emails] Auto-vinculados ${contatos.length} contatos`)
    }
  }
}
```

### 2. Backfill de emails existentes sem `contato_id`

Para corrigir os emails já sincronizados que estão sem vínculo, adicionar uma etapa de backfill no mesmo sync:
- Busca emails existentes com `contato_id IS NULL`
- Tenta vincular pelos mesmos critérios

**Mesmo arquivo:** `supabase/functions/sync-emails/index.ts`

### 3. ContatoCard - Melhoria no fallback por nome (opcional)

Adicionar um terceiro nível de busca no `ContatoCard`: se não encontrar por `contato_id` nem por email exato, tentar buscar por nome (usando `de_nome` do email contra `nome` do contato). Isso captura casos onde o contato existe mas com email diferente.

**Arquivo:** `src/modules/emails/components/ContatoCard.tsx`

## Arquivos a editar

1. `supabase/functions/sync-emails/index.ts` — Adicionar auto-vinculação de `contato_id` por email + backfill de existentes
2. `src/modules/emails/components/ContatoCard.tsx` — Adicionar fallback por nome como terceira tentativa de busca
