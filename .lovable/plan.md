
# Plano: Melhorar UX dos Campos de Trial + Select Inline no Dashboard

## Resumo

Duas melhorias focadas na experiência do usuário:

1. **Configurações > Stripe**: Melhorar os campos de Trial com componentes apropriados
2. **Dashboard**: Integrar o select de período inline no texto do toolbar

---

## Parte 1: Melhorar Campos de Trial em Configurações

### Problema Atual

```text
Permitir Trial: [true       ] ← Input de texto livre
Dias de Trial:  [14         ] ← Input de texto livre
```

A UX é confusa pois o usuário precisa digitar "true" ou "false" manualmente.

### Solução

Transformar os campos de Trial em componentes apropriados:

```text
┌─────────────────────────────────────────────────────────────┐
│ CONFIGURAÇÕES DE TRIAL                                      │
├─────────────────────────────────────────────────────────────┤
│  Permitir Trial                           [●━━━━━] ← Toggle │
│  Novos usuários podem iniciar trial                         │
│                                                             │
│  Dias de Trial                                              │
│  [   14   ↕] ← Input numérico                              │
│  Duração do período de trial (1-365 dias)                   │
└─────────────────────────────────────────────────────────────┘
```

### Alterações

**Arquivo:** `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx`

1. Criar tipo de campo especial `type: 'toggle' | 'number' | 'text'`
2. Modificar a interface `CampoConfig`:

```tsx
interface CampoConfig {
  name: string
  label: string
  placeholder: string
  secret?: boolean
  required?: boolean
  hint?: string
  type?: 'text' | 'toggle' | 'number'  // Novo
}
```

3. Atualizar os campos de Stripe:

```tsx
case 'stripe':
  return [
    { name: 'publishable_key', label: 'Publishable Key', ... },
    { name: 'secret_key', label: 'Secret Key', ... },
    { name: 'webhook_secret', label: 'Webhook Secret', ... },
    { 
      name: 'trial_habilitado', 
      label: 'Permitir Trial', 
      type: 'toggle',  // Novo
      hint: 'Novos usuários podem iniciar período de teste gratuito' 
    },
    { 
      name: 'trial_dias', 
      label: 'Dias de Trial', 
      type: 'number',  // Novo
      placeholder: '14',
      hint: 'Duração do período de trial (1-365 dias)' 
    },
  ]
```

4. No formulário, renderizar baseado no `type`:

```tsx
{campo.type === 'toggle' ? (
  <label className="flex items-center gap-3 h-11">
    <input
      type="checkbox"
      checked={getValor(campo.name) === 'true'}
      onChange={(e) => setValores(prev => ({ 
        ...prev, 
        [campo.name]: e.target.checked ? 'true' : 'false' 
      }))}
      className="w-10 h-6 rounded-full ..."
    />
    <span className="text-sm text-muted-foreground">
      {getValor(campo.name) === 'true' ? 'Habilitado' : 'Desabilitado'}
    </span>
  </label>
) : campo.type === 'number' ? (
  <input
    type="number"
    min="1"
    max="365"
    value={getValor(campo.name)}
    onChange={...}
    className="..."
  />
) : (
  // Input de texto padrão
)}
```

### Separar Seção de Trial

Agrupar os campos de Trial em uma seção visual separada:

```tsx
// Após campos normais, adicionar divisor
{plataforma === 'stripe' && (
  <div className="pt-4 mt-4 border-t border-border">
    <h3 className="text-sm font-medium text-foreground mb-4">
      Configurações de Trial
    </h3>
    {/* Campos trial_habilitado e trial_dias aqui */}
  </div>
)}
```

---

## Parte 2: Select Inline no Dashboard

### Problema Atual

```text
Dashboard · Visão geral dos últimos 7 dias    [▼ Últimos 7 dias]
                ↑ Texto                              ↑ Select
                     Informação duplicada!
```

### Solução

Integrar o select dentro do texto do subtitle:

```text
Dashboard · Visão geral dos [▼ últimos 30 dias]
                             └─ Select estilizado como texto
```

### Alterações

**Arquivo:** `src/modules/admin/pages/DashboardPage.tsx`

1. Remover `setActions` (não haverá mais botão separado)

2. Passar componente JSX para `setSubtitle`:

```tsx
useEffect(() => {
  setSubtitle(
    <span className="flex items-center gap-1 text-muted-foreground">
      Visão geral dos{' '}
      <select
        value={periodo}
        onChange={(e) => setPeriodo(e.target.value as Periodo)}
        className="
          ml-1 px-1 py-0.5
          bg-transparent 
          border-b border-muted-foreground/30
          text-foreground font-medium
          cursor-pointer
          hover:border-primary
          focus:outline-none focus:border-primary
          appearance-none
        "
        style={{ paddingRight: '1.5rem' }}
      >
        <option value="7d">últimos 7 dias</option>
        <option value="30d">últimos 30 dias</option>
        <option value="60d">últimos 60 dias</option>
        <option value="90d">últimos 90 dias</option>
      </select>
      {/* Ícone de seta */}
      <ChevronDown className="w-3 h-3 -ml-5 pointer-events-none" />
    </span>
  )
  return () => setSubtitle(null)
}, [periodo, setSubtitle])
```

### Período Personalizado (Fase 2 - Opcional)

Deixar a opção "Personalizado" para implementação futura, pois requer:
- Componentes de Calendar/DatePicker
- Popover com seleção de intervalo
- Maior complexidade de UX

Foco atual: 7, 30, 60, 90 dias com select inline.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `ConfiguracoesGlobaisPage.tsx` | Toggle para Trial + Input numérico para dias + Seção separada |
| `DashboardPage.tsx` | Select inline no subtitle |

---

## Resultado Visual Esperado

### Configurações > Stripe

```text
┌───────────────────────────────────────────────────────────────────┐
│ Stripe                                                  Configurado │
│ Pagamentos                                                         │
├───────────────────────────────────────────────────────────────────┤
│ Publishable Key *                                                  │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ pk_live_...                                                  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Secret Key *                                                       │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ••••••••••••                                              👁  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│ Armazenada como secret no Supabase                                 │
│                                                                    │
│ Webhook Secret                                                     │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ••••••••••••                                              👁  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│─────────────────────────────────────────────────────────────────── │
│ CONFIGURAÇÕES DE TRIAL                                             │
│                                                                    │
│ Permitir Trial                                                     │
│ [●━━━━━━━━] Habilitado                                            │
│ Novos usuários podem iniciar período de teste gratuito             │
│                                                                    │
│ Dias de Trial                                                      │
│ ┌──────────┐                                                      │
│ │    14    │                                                      │
│ └──────────┘                                                      │
│ Duração do período de trial (1-365 dias)                          │
├───────────────────────────────────────────────────────────────────┤
│ [Testar Conexão]                             [Salvar Alterações]   │
└───────────────────────────────────────────────────────────────────┘
```

### Dashboard (Toolbar)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Dashboard · Visão geral dos [▼ últimos 30 dias]                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Esclarecimento sobre Trial vs Planos

Para evitar confusão futura, o plano mostrará:

| Configurações > Stripe | Planos > Trial |
|------------------------|----------------|
| **Quando**: Global | **O que**: Limites |
| `trial_habilitado` | `limite_usuarios` |
| `trial_dias` | `limite_storage_mb` |
| | `limite_oportunidades` |

**Configurações**: Define SE trial está habilitado e POR QUANTO TEMPO dura  
**Planos > Trial**: Define OS RECURSOS que o usuário tem durante o trial

São complementares, não duplicados.
