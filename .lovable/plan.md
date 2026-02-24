
# Correção: Cache Stale de Campos Customizados + Garantia de Persistência

## Diagnóstico Final

Após investigação no banco de dados:

- **Dados ESTÃO sendo salvos corretamente** — contato "teste show" tem owner_id + 5 campos custom no banco
- **Empresa "Renove Digital"** tem owner_id mas 0 campos custom — provavelmente criada antes do deploy do fix anterior
- **Screenshot mostra contato diferente** ("Djavan teste", origem WhatsApp) que nunca teve campos custom preenchidos

## Problema Real: Cache Stale

Após salvar campos customizados, a query `['valores-custom-contato-view', contato.id]` no `ContatoViewModal` **não é invalidada**. Isso causa:

1. No fluxo de **edição** (abrir view -> editar -> salvar -> reabrir view): mostra dados antigos do cache
2. No fluxo de **criação** seguido de visualização: pode mostrar dados vazios se houve visualização anterior

## Plano de Correção

### 1. Invalidar cache de valores custom após salvar

**Arquivo:** `src/modules/contatos/pages/ContatosPage.tsx`

Após cada chamada bem-sucedida de `salvarCamposCustomizados`, adicionar invalidação explícita do cache:

```typescript
// Após salvarCamposCustomizados no onSuccess (tanto criação quanto edição)
await contatosApi.salvarCamposCustomizados(...)
queryClient.invalidateQueries({ queryKey: ['valores-custom-contato-view'] })
```

Isso requer importar `useQueryClient` e obter a instância no componente.

### 2. Forçar refetch no ViewModal ao abrir

**Arquivo:** `src/modules/contatos/components/ContatoViewModal.tsx`

Configurar a query de valores custom com `staleTime: 0` para garantir refetch sempre que o modal abrir:

```typescript
const { data: valoresCustom } = useQuery({
  queryKey: ['valores-custom-contato-view', contato?.id],
  queryFn: async () => { ... },
  enabled: !!contato?.id && open,
  staleTime: 0, // Sempre refetch ao abrir
})
```

### 3. Log mais claro no fluxo de empresa

**Arquivo:** `src/modules/contatos/pages/ContatosPage.tsx`

Adicionar log do `tipo` sendo passado para `salvarCamposCustomizados` para confirmar que empresa usa o tipo correto:

```typescript
console.log('[handleFormSubmit] Salvando campos custom. tipo:', tipo, 'contatoId:', contato.id)
```

## Resumo de Arquivos

| Arquivo | Alteração |
|---|---|
| `src/modules/contatos/pages/ContatosPage.tsx` | Invalidar cache `valores-custom-contato-view` após salvar; adicionar log do tipo |
| `src/modules/contatos/components/ContatoViewModal.tsx` | Adicionar `staleTime: 0` na query de valores custom |
