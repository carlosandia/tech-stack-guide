
# Ajustes no Dashboard: Remover Toolbar, Corrigir Scroll e Responsividade

## Problema

1. **Toolbar desnecessaria**: A barra "Dashboard - Relatorio de funil" ocupa 48px de altura sem utilidade nessa tela
2. **Scroll quebrado**: O `main` do layout usa `overflow-hidden` e o Dashboard nao tem scroll proprio
3. **Responsividade**: Filtros e componentes podem estourar 100% em mobile

## Solucao

### 1. Remover toolbar do Dashboard

No `DashboardPage.tsx`, remover o `useAppToolbar` e o `setSubtitle('Relatorio de funil')`. No `AppLayout.tsx`, ocultar o toolbar quando a rota for `/dashboard` (adicionando na lista de `hideToolbar`).

### 2. Header inline compacto

Substituir o header atual (com emoji) por uma versao profissional e compacta:

```text
Relatorio de funil                    [7d] [30d] [90d] [Personalizado] [Funil v]
Ola, Carlos · Ultimos 30 dias
```

- Titulo: "Relatorio de funil" em `text-lg font-semibold`
- Subtitulo: "Ola, {nome} · {periodo label}" em `text-sm text-muted-foreground`, sem emoji
- Filtros ao lado direito no desktop, abaixo no mobile

### 3. Corrigir scroll

No `AppLayout.tsx`, trocar `overflow-hidden` do `main` para `overflow-y-auto` para permitir scroll do conteudo. Ou, alternativamente, adicionar `overflow-y-auto h-full` no container do Dashboard.

A abordagem mais segura: manter `overflow-hidden` no main e adicionar scroll individual no DashboardPage com `overflow-y-auto` e altura calculada.

### 4. Responsividade mobile

- Filtros: em mobile (`<640px`), empilhar verticalmente com `flex-col`
- Botoes de periodo: fazer scroll horizontal ou quebrar em 2x2
- Cards KPI: ja usam grid responsivo
- Funil: ja tem versao vertical mobile
- Donut chart: ja tem `flex-col` em mobile

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/modules/app/pages/DashboardPage.tsx` | Remover useAppToolbar, ajustar header inline, adicionar scroll container |
| `src/modules/app/layouts/AppLayout.tsx` | Adicionar `/dashboard` ao hideToolbar |
| `src/modules/app/components/dashboard/DashboardFilters.tsx` | Ajustar responsividade mobile dos filtros |

## Detalhes tecnicos

**AppLayout.tsx** - linha 266:
```typescript
const hideToolbar = isEditorRoute || isPipelineConfig || isPerfilRoute || location.pathname === '/dashboard'
```

**DashboardPage.tsx** - remover imports de `useAppToolbar` e useEffect do subtitle. Envolver conteudo em container com `overflow-y-auto h-full`. Header compacto:
```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
  <div>
    <h2 className="text-lg font-semibold text-foreground">Relatorio de funil</h2>
    <p className="text-sm text-muted-foreground">
      Ola, {user?.nome || 'Usuario'} · {relatorio.periodo.label}
    </p>
  </div>
  <DashboardFilters ... />
</div>
```

**DashboardFilters.tsx** - botoes de periodo com scroll horizontal em mobile:
```tsx
<div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 overflow-x-auto max-w-full">
```
