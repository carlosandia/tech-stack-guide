
# Corrigir Link de Parceiro Invalido no Mobile

## Problema

A pagina `/parceiro/:codigo` faz `supabase.from('parceiros').select(...)` diretamente, mas a policy de SELECT para usuarios anonimos (`anon_select_parceiro_ativo_por_codigo`) foi removida na migration `20260223034026`. Atualmente, a unica policy existente na tabela `parceiros` e `super_admin_parceiros` (requer `is_super_admin_v2()`).

Como a pagina e publica (sem login), a query retorna `null` e exibe "Link de indicacao invalido".

Ja existe uma funcao `get_partner_name_by_code(p_codigo)` (SECURITY DEFINER) que retorna o nome da organizacao parceira, mas ela so retorna o nome -- a pagina precisa tambem do `id` do parceiro para o fluxo de checkout.

## Solucao

### 1. Criar funcao RPC `validate_partner_code` (SECURITY DEFINER)

Nova funcao que retorna `id`, `codigo_indicacao` e `nome_organizacao` do parceiro ativo, acessivel por anon sem expor a tabela inteira.

```text
CREATE FUNCTION public.validate_partner_code(p_codigo text)
RETURNS TABLE(id uuid, codigo_indicacao text, organizacao_nome text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
```

### 2. Alterar `ParceiroPage.tsx`

Substituir a query direta `supabase.from('parceiros').select(...)` por `supabase.rpc('validate_partner_code', { p_codigo: codigo })`.

Adaptar o tipo `Parceiro` para usar a resposta da RPC.

## Arquivos

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Criar funcao `validate_partner_code` |
| `src/modules/public/pages/ParceiroPage.tsx` | Alterar query para usar RPC |
