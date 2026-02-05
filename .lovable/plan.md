
# Plano: Padronizar Toolbar em Todas as Páginas do Admin

## Problema Identificado

Analisando as screenshots e o código, identifiquei inconsistências no uso do Toolbar:

| Página | Situação Atual | Problema |
|--------|---------------|----------|
| **Planos** | `Planos · Gerencie os planos da plataforma` | Correto (padrão) |
| **Organizações** | `Organizações · Gerencie os tenants...` | Correto (padrão) |
| **Configurações** | Apenas "Configurações" no toolbar | Falta subtítulo |
| **Dashboard** | Apenas "Dashboard" no toolbar | Falta subtítulo |
| **Módulos** | Apenas "Módulos" no toolbar | É uma página placeholder |

## Padrão Correto (referência: OrganizacoesPage)

```tsx
const { setActions, setSubtitle } = useToolbar()

useEffect(() => {
  setSubtitle('Descrição da página')
  return () => setSubtitle(null)
}, [setSubtitle])
```

## Alterações Necessárias

### 1. DashboardPage.tsx

**Arquivo:** `src/modules/admin/pages/DashboardPage.tsx`

Adicionar integração com o Toolbar:

```text
Antes:
- Linha 61: <p className="text-sm text-muted-foreground">Visão geral dos últimos 30 dias</p>

Depois:
- Importar useToolbar e useEffect
- Adicionar useEffect com setSubtitle('Visão geral dos últimos 30 dias')
- Remover o parágrafo <p> do conteúdo
```

**Resultado no Toolbar:**
```
Dashboard · Visão geral dos últimos 30 dias
```

---

### 2. ConfiguracoesGlobaisPage.tsx

**Arquivo:** `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx`

Adicionar integração com o Toolbar:

```text
Antes:
- Linha 45-50: Header interno com h1 e p separados

Depois:
- Importar useToolbar e useEffect
- Adicionar useEffect com setSubtitle('Configure as integrações da plataforma')
- Remover o bloco de header interno (<div> com h1 e p)
```

**Resultado no Toolbar:**
```
Configurações · Configure as integrações da plataforma
```

---

### 3. Módulos (Placeholder em App.tsx)

**Arquivo:** `src/App.tsx`

O Módulos usa o `PlaceholderPage` genérico que não tem integração com o Toolbar. 

Duas opções:
1. **Opção A (recomendada):** Criar uma página `ModulosPage.tsx` que usa o Toolbar corretamente
2. **Opção B:** Modificar o PlaceholderPage para aceitar um subtitle

**Implementação (Opção A):**

Criar `src/modules/admin/pages/ModulosPage.tsx`:

```tsx
import { useEffect } from 'react'
import { useToolbar } from '../contexts/ToolbarContext'
import { Puzzle } from 'lucide-react'

export function ModulosPage() {
  const { setSubtitle } = useToolbar()

  useEffect(() => {
    setSubtitle('Gerencie os módulos disponíveis')
    return () => setSubtitle(null)
  }, [setSubtitle])

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Puzzle className="w-6 h-6 text-muted-foreground" />
          <p className="text-muted-foreground">
            Esta página será implementada em breve.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModulosPage
```

Atualizar `src/modules/admin/index.ts` para exportar a nova página.

Atualizar `src/App.tsx` linha 107 para usar `<AdminModulosPage />` em vez de `<PlaceholderPage title="Modulos" />`.

---

## Resumo das Mudanças

| Arquivo | Ação |
|---------|------|
| `DashboardPage.tsx` | Adicionar useToolbar + remover parágrafo interno |
| `ConfiguracoesGlobaisPage.tsx` | Adicionar useToolbar + remover header interno |
| `ModulosPage.tsx` | Criar nova página com Toolbar integrado |
| `index.ts` (admin) | Exportar nova página |
| `App.tsx` | Usar AdminModulosPage no lugar do placeholder |

## Resultado Visual Esperado

Todas as páginas seguirão o padrão:

```text
┌────────────────────────────────────────────────────────────────────┐
│ [Título] · [Descrição contextual]                    [Ações/Botões]│
└────────────────────────────────────────────────────────────────────┘
```

- **Dashboard** · Visão geral dos últimos 30 dias
- **Organizações** · Gerencie os tenants da plataforma (já OK)
- **Planos** · Gerencie os planos da plataforma (já OK)
- **Módulos** · Gerencie os módulos disponíveis
- **Configurações** · Configure as integrações da plataforma
