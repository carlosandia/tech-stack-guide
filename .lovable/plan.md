
# Remocao de Filtro Redundante no Modulo de Contatos

## Contexto

A funcao `duplicatas` em `src/modules/contatos/services/contatos.api.ts` (linha 549) aplica um filtro explicito `.eq('organizacao_id', organizacaoId)` que e redundante porque a tabela `contatos` ja possui RLS ativo com policy `organizacao_id = get_user_tenant_id()`. O RLS garante o isolamento por tenant automaticamente em toda query feita pelo Supabase client.

## O que sera feito

### Arquivo: `src/modules/contatos/services/contatos.api.ts`

Na funcao `duplicatas` (linhas 542-583):

- **Remover** a chamada `await getOrganizacaoId()` (linha 544) que busca o `organizacao_id` desnecessariamente
- **Remover** o filtro `.eq('organizacao_id', organizacaoId)` (linha 549)
- A query continuara protegida pelo RLS, que filtra automaticamente pelo tenant do usuario autenticado

**Antes:**
```typescript
duplicatas: async () => {
  const organizacaoId = await getOrganizacaoId()
  const { data, error } = await supabase
    .from('contatos')
    .select('id, nome, sobrenome, email, telefone, tipo, status, criado_em')
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('email')
```

**Depois:**
```typescript
duplicatas: async () => {
  const { data, error } = await supabase
    .from('contatos')
    .select('id, nome, sobrenome, email, telefone, tipo, status, criado_em')
    .is('deletado_em', null)
    .order('email')
```

## Impacto

- Nenhuma mudanca funcional: o RLS continua garantindo isolamento por tenant
- Remocao de uma chamada de rede desnecessaria (`getOrganizacaoId` faz query na tabela `usuarios`)
- Codigo mais consistente com o padrao usado nas demais funcoes do modulo (listar, buscar, atualizar, excluir) que ja confiam no RLS
