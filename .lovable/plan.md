
# Plano: Filtro de Período no Dashboard + Unificação de Módulos

## Resumo

Duas implementações:

1. **Dashboard**: Adicionar dropdown de seleção de período no toolbar com opções 7, 30, 60, 90 dias e personalizado
2. **Módulos**: Exibir os mesmos módulos que aparecem em `/planos` na página `/modulos`, pois usam a mesma fonte de dados

---

## Parte 1: Filtro de Período no Dashboard

### 1.1 Alterar DashboardPage.tsx

**Estado local para período:**
```tsx
const [periodo, setPeriodo] = useState<string>('30d')
```

**Atualizar query para usar período dinâmico:**
```tsx
const { data: metricas } = useQuery({
  queryKey: ['admin', 'metricas', 'resumo', periodo],
  queryFn: () => adminApi.obterMetricasResumo(periodo as '7d' | '30d' | '60d' | '90d'),
})
```

**Atualizar subtitle dinamicamente:**
```tsx
const subtitleMap: Record<string, string> = {
  '7d': 'Visão geral dos últimos 7 dias',
  '30d': 'Visão geral dos últimos 30 dias',
  '60d': 'Visão geral dos últimos 60 dias',
  '90d': 'Visão geral dos últimos 90 dias',
}
setSubtitle(subtitleMap[periodo] || 'Visão geral')
```

**Adicionar dropdown no toolbar (via setActions):**

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Dashboard · Visão geral dos últimos 30 dias    [▼ Últimos 30 dias]       │
└──────────────────────────────────────────────────────────────────────────┘
```

O dropdown terá opções:
- Últimos 7 dias
- Últimos 30 dias (padrão)
- Últimos 60 dias
- Últimos 90 dias

### 1.2 Atualizar obterMetricasResumo no admin.api.ts

Modificar a função para realmente usar o parâmetro `periodo`:

```tsx
export async function obterMetricasResumo(
  periodo: '7d' | '30d' | '60d' | '90d' = '30d'
): Promise<MetricasResumo> {
  // Calcular dias baseado no período
  const diasMap = { '7d': 7, '30d': 30, '60d': 60, '90d': 90 }
  const dias = diasMap[periodo]
  
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - dias)
  
  // Usar dataInicio nas queries...
}
```

### 1.3 Tipo de Período Atualizado

Atualizar a tipagem para incluir 60d:
```tsx
periodo: '7d' | '30d' | '60d' | '90d'
```

---

## Parte 2: Página de Módulos

### 2.1 Situação Atual

| Local | Status |
|-------|--------|
| `/admin/planos` → "Módulos Disponíveis" | Mostra módulos via `useModulos()` |
| `/admin/modulos` | Placeholder: "Esta página será implementada em breve" |

**Ambos usam a mesma fonte:** `adminApi.listarModulos()` → tabela `modulos`

### 2.2 Proposta

**Opção escolhida:** Exibir os módulos na página `/admin/modulos` (igual ao que aparece em Planos), e manter a seção em Planos como referência informativa.

Isso permite que:
- A página `/admin/modulos` seja o local centralizado para ver todos os módulos
- A seção em `/admin/planos` continue como referência rápida do que está disponível

### 2.3 Atualizar ModulosPage.tsx

```tsx
import { useModulos } from '../hooks/usePlanos'
import { Puzzle } from 'lucide-react'

export function ModulosPage() {
  const { data: modulos, isLoading } = useModulos()
  const { setSubtitle } = useToolbar()

  // Renderizar grid de módulos igual ao PlanosPage
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Módulos do Sistema</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {modulos?.map((modulo) => (
            <div key={modulo.id} className="...">
              {/* Card do módulo */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/pages/DashboardPage.tsx` | Adicionar estado `periodo`, dropdown no toolbar, atualizar query |
| `src/modules/admin/services/admin.api.ts` | Atualizar `obterMetricasResumo` para filtrar por período real |
| `src/modules/admin/pages/ModulosPage.tsx` | Implementar listagem de módulos usando `useModulos()` |

---

## Detalhes Técnicos

### Componente do Dropdown de Período

Será um select simples estilizado conforme Design System:

```tsx
<select
  value={periodo}
  onChange={(e) => setPeriodo(e.target.value)}
  className="px-3 py-1.5 text-sm border border-border rounded-md bg-card"
>
  <option value="7d">Últimos 7 dias</option>
  <option value="30d">Últimos 30 dias</option>
  <option value="60d">Últimos 60 dias</option>
  <option value="90d">Últimos 90 dias</option>
</select>
```

### Integração no Toolbar

O dropdown será injetado via `setActions()` no useEffect, atualizando quando o período mudar.

---

## Resultado Visual Esperado

### Dashboard com Filtro

```text
┌────────────────────────────────────────────────────────────────────┐
│ Dashboard · Visão geral dos últimos 30 dias   [▼ Últimos 30 dias]  │
└────────────────────────────────────────────────────────────────────┘
```

### Página de Módulos

```text
┌────────────────────────────────────────────────────────────────────┐
│ Módulos · Gerencie os módulos disponíveis                          │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Contatos │  │ Negócios │  │ Conversas│  │Formulários│           │
│  │ Gestão...│  │ Pipeline.│  │ Central..│  │ Form Buil.│           │
│  │Obrigatório│ │Obrigatório│ │          │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Conexões │  │Atividades│  │ Dashboard│  │Automações│           │
│  │ WhatsApp.│  │ Lista ta.│  │ Painel d.│  │ Motor au.│           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└────────────────────────────────────────────────────────────────────┘
```
