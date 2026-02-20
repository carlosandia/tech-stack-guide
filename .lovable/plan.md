

## Melhorar Tratamento de Erro na Criacao de Publico Meta Ads

### Problema

1. **Mensagem generica na UI**: O `onError` do mutation mostra apenas "Erro ao criar publico", escondendo a mensagem real do Meta que explica exatamente o que o usuario precisa fazer.
2. **Erro real do Meta**: `error_subcode: 1870050` - "A conta comercial e necessaria para criar/editar este publico". A conta de anuncios precisa estar vinculada a um Business Manager.
3. **Possivel conta errada**: Os logs mostram `act_1278278927253301` sendo usada, mas a screenshot mostra a conta `620396347755218` no Business Manager. Pode ser que a conta selecionada no CRM nao seja a mesma vinculada ao Business Manager.

### Correcoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/configuracoes/components/integracoes/meta/CustomAudiencesPanel.tsx` | Exibir mensagem de erro real do Meta no toast, incluindo `error_user_msg` quando disponivel |
| `supabase/functions/meta-audiences/index.ts` | Retornar `error_user_title` e `error_user_msg` do Meta na resposta para que o frontend mostre a orientacao correta |

### Detalhes tecnicos

**1. Edge Function - Retornar mensagens descritivas do Meta (`meta-audiences/index.ts`)**

No bloco de erro do create (linhas 150-161), extrair `error_user_title` e `error_user_msg` da resposta do Meta e incluir na resposta JSON:

```text
if (!createResponse.ok || createData.error) {
  const metaError = createData.error || {};
  const errorMsg = metaError.error_user_msg || metaError.message || "Erro ao criar publico no Meta";
  // Retornar a mensagem amigavel do Meta diretamente
  return Response com { error: errorMsg }
}
```

Isso garante que mensagens como "Para criar ou editar um publico personalizado... seu administrador precisara adicionar essa conta de anuncios a uma empresa" cheguem ao frontend.

**2. Frontend - Mostrar erro real no toast (`CustomAudiencesPanel.tsx`)**

Alterar o `onError` do mutation `criar` (linha 67) para extrair e exibir a mensagem real:

```text
onError: (err: Error) => toast.error(err.message || 'Erro ao criar publico'),
```

Isso mostra a mensagem que veio do Meta em vez do texto generico.

### Resultado esperado

Quando o usuario tentar criar um publico e o Meta retornar erro, o toast mostrara a mensagem exata do Meta, como:
- "Para criar ou editar um publico personalizado com base em uma lista de clientes, seu administrador precisara adicionar essa conta de anuncios a uma empresa."

Isso permite que o usuario entenda imediatamente o que precisa fazer no Meta Business Manager sem precisar de suporte.
