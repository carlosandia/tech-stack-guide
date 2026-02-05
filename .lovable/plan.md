
# Plano: Adicionar Subtítulo no Toolbar da Página de Planos

## Problema Identificado

A página `PlanosPage` não segue o padrão de navegação/toolbar estabelecido. Atualmente ela exibe a descrição como um parágrafo separado no conteúdo:

```tsx
// Atual (incorreto)
<p className="text-sm text-muted-foreground">Gerencie os planos da plataforma</p>
```

O correto é usar o `setSubtitle` do `ToolbarContext` para que apareça no formato:
**Planos · Gerencie os planos da plataforma**

## Padrão Correto (usado em OrganizacoesPage)

```tsx
const { setActions, setSubtitle } = useToolbar()

useEffect(() => {
  setSubtitle('Gerencie os tenants da plataforma')
  return () => setSubtitle(null)
}, [setSubtitle])
```

## Alteração Necessária

**Arquivo:** `src/modules/admin/pages/PlanosPage.tsx`

1. Importar `setSubtitle` do hook `useToolbar`
2. Adicionar `useEffect` para definir o subtítulo
3. Remover o parágrafo de descrição do conteúdo

### Código Atual vs Novo

| Linha | Atual | Novo |
|-------|-------|------|
| 20 | `const { setActions } = useToolbar()` | `const { setActions, setSubtitle } = useToolbar()` |
| 24-36 | apenas setActions | adicionar setSubtitle |
| 68 | `<p className="...">Gerencie os planos...</p>` | **remover** |

### Resultado Visual no Toolbar

```text
┌────────────────────────────────────────────────────────────────┐
│ Planos · Gerencie os planos da plataforma        [+ Novo Plano]│
└────────────────────────────────────────────────────────────────┘
```

Em mobile, o subtítulo será ocultado automaticamente (classe `hidden sm:inline`), mantendo apenas "Planos".
