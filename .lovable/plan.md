

# Unificar Assinatura de Email com Assinatura Global (Config Geral)

## Problema

Existem dois sistemas de assinatura duplicados:
- **Configuracoes > Config Geral**: campo `assinatura_mensagem` na tabela `configuracoes_tenant` (editor rico com imagens, tabelas, etc.)
- **Modulo Emails**: tabela separada `emails_assinaturas` com `AssinaturaModal` proprio

O correto e usar apenas a assinatura global de Configuracoes, eliminando a duplicidade.

## Alteracoes

### 1. Remover botao "Assinatura" da toolbar do modulo Emails

**Arquivo:** `src/modules/emails/pages/EmailsPage.tsx`

- Remover o estado `assinaturaOpen`
- Remover o botao "Assinatura" da toolbar superior
- Remover o componente `<AssinaturaModal>`
- Remover import do `AssinaturaModal`

### 2. Alterar `ComposeEmailModal` para usar assinatura global

**Arquivo:** `src/modules/emails/components/ComposeEmailModal.tsx`

- Remover import de `useAssinatura` do hook de emails
- Adicionar query direta a `configuracoes_tenant.assinatura_mensagem`
- Adaptar `buildInitialContent()` para usar o HTML da assinatura global (sempre incluir em novos e respostas, ja que a config global nao tem esses toggles separados)

### 3. Manter `AssinaturaModal.tsx` e hooks no codigo (sem uso)

Nao e necessario deletar os arquivos agora — apenas desconectar. Podem ser removidos em cleanup futuro.

## Detalhes Tecnicos

### ComposeEmailModal - Nova query de assinatura

```typescript
// Substitui useAssinatura() por query direta ao configuracoes_tenant
const { data: configTenant } = useQuery({
  queryKey: ['config-tenant-localizacao'],  // reutiliza cache existente
  queryFn: async () => {
    const { data } = await supabase
      .from('configuracoes_tenant')
      .select('assinatura_mensagem')
      .maybeSingle()
    return data
  },
  staleTime: 5 * 60 * 1000,
})

// No buildInitialContent:
const signatureHtml = configTenant?.assinatura_mensagem
  ? `<br/><div class="email-signature" style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;">${configTenant.assinatura_mensagem}</div>`
  : ''
```

### EmailsPage - Itens removidos

- Estado: `assinaturaOpen` / `setAssinaturaOpen`
- Botao: `<button onClick={() => setAssinaturaOpen(true)}>Assinatura</button>`
- Componente: `<AssinaturaModal isOpen={assinaturaOpen} onClose={...} />`

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/emails/pages/EmailsPage.tsx` | Remove botao e modal de assinatura |
| `src/modules/emails/components/ComposeEmailModal.tsx` | Usa `configuracoes_tenant.assinatura_mensagem` em vez de `emails_assinaturas` |

