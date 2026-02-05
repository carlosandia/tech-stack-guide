
# Plano: Correções no Plano Trial

## Resumo

Corrigir a experiência do plano Trial tanto no painel Admin quanto na página pública, removendo campos irrelevantes e garantindo consistência dos dados.

---

## Problemas Identificados

| Problema | Localização | Impacto |
|----------|-------------|---------|
| Modal mostra campos de preço para Trial | `PlanoFormModal.tsx` | UX confusa - Trial é grátis |
| Modal mostra integração Stripe para Trial | `PlanoFormModal.tsx` | Irrelevante - Trial não tem checkout |
| Trial na página pública usa dados hardcoded | `public/PlanosPage.tsx` | Limites inconsistentes com o cadastrado |
| Nome do plano Trial editável | `PlanoFormModal.tsx` | Risco de quebrar identificação |

---

## Correções a Implementar

### 1. Modal de Edição - Ocultar Seções para Trial

Quando `isTrial === true`, ocultar as seguintes seções:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODAL EDITAR PLANO TRIAL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INFORMAÇÕES BÁSICAS                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │ Nome do Plano *         │  │ Ordem                   │                   │
│  │ [Trial        ] 🔒      │  │ [1                    ] │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│       ↑ Readonly/Disabled                                                    │
│                                                                              │
│  Descrição                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Teste gratuito para novos usuários                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  PREÇOS                            ← OCULTO PARA TRIAL                ║  │
│  ║  INTEGRAÇÃO STRIPE                 ← OCULTO PARA TRIAL                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  LIMITES (-1 = ilimitado)  ← VISÍVEL (configura recursos do trial)          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                 │
│  │ Usuários  │  │ Oport.    │  │ Storage   │  │ Contatos  │                 │
│  │ [2      ] │  │ [50     ] │  │ [100    ] │  │ [100    ] │                 │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘                 │
│                                                                              │
│  STATUS                                                                      │
│  [✓] Plano Ativo    [✓] Visível para Clientes                               │
│                                                                              │
│  MÓDULOS INCLUÍDOS                                                           │
│  ...                                                                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                        [Cancelar]  [Salvar Alterações]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Campo Nome Bloqueado para Trial

O campo "Nome do Plano" será `readOnly` quando for Trial, para evitar que a identificação seja alterada acidentalmente.

### 3. Página Pública - Usar Dados do Banco

Atualmente o card Trial na página pública usa valores hardcoded. Corrigir para buscar o plano Trial do banco de dados e usar seus limites reais.

**Antes (hardcoded):**
```tsx
<li>2 usuarios</li>
<li>100 oportunidades</li>
<li>100MB armazenamento</li>
```

**Depois (dinâmico):**
```tsx
// Buscar plano Trial junto com os outros planos
const trialPlan = planos.find(p => p.nome.toLowerCase() === 'trial')

<li>{trialPlan?.limite_usuarios || 2} usuarios</li>
<li>{trialPlan?.limite_oportunidades || 50} oportunidades</li>
<li>{formatStorage(trialPlan?.limite_storage_mb)} armazenamento</li>
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/components/PlanoFormModal.tsx` | Ocultar seções Preços e Stripe para Trial; bloquear nome |
| `src/modules/public/pages/PlanosPage.tsx` | Usar dados do plano Trial do banco ao invés de hardcoded |

---

## Detalhes Técnicos

### PlanoFormModal.tsx

**Mudanças no JSX:**

```tsx
// Campo nome - readOnly para Trial
<input
  {...register('nome')}
  readOnly={isTrial}
  className={`... ${isTrial ? 'bg-muted cursor-not-allowed' : ''}`}
/>
{isTrial && (
  <p className="text-xs text-muted-foreground mt-1">
    Nome do plano padrão não pode ser alterado
  </p>
)}

// Seções condicionais
{!isTrial && (
  <>
    {/* Seção Preços */}
    <div className="space-y-4">
      <h3>Preços</h3>
      ...
    </div>

    {/* Seção Integração Stripe */}
    <div className="space-y-4">
      <h3>Integração Stripe</h3>
      ...
    </div>
  </>
)}
```

### public/PlanosPage.tsx

**Mudanças na query:**

```tsx
// Buscar TODOS os planos (incluindo Trial)
const { data, error } = await supabase
  .from('planos')
  .select('*')
  .eq('ativo', true)
  .order('ordem', { ascending: true })

// Separar Trial dos pagos
const trialPlan = data?.find(p => 
  p.nome.toLowerCase() === 'trial' || p.preco_mensal === 0
)
const paidPlans = data?.filter(p => 
  p.preco_mensal && p.preco_mensal > 0
)
```

**Mudanças no JSX do card Trial:**

```tsx
{trialConfig.trial_habilitado && trialPlan && (
  <div className="...">
    ...
    <ul className="space-y-3 mb-8 flex-1">
      <li>
        <Check className="..." />
        {trialPlan.limite_usuarios === -1 
          ? 'Usuários ilimitados' 
          : `${trialPlan.limite_usuarios} usuarios`}
      </li>
      <li>
        <Check className="..." />
        {formatLimit(trialPlan.limite_oportunidades)} oportunidades
      </li>
      <li>
        <Check className="..." />
        {formatStorage(trialPlan.limite_storage_mb)} armazenamento
      </li>
    </ul>
    ...
  </div>
)}
```

---

## Validação: Trial Não Pode Ser Escolhido Após Expirar

Esta validação deve ser feita na Edge Function `iniciar-trial`, verificando se o email já foi usado em um trial anterior. Isso é uma implementação de backend e pode ser feita em uma tarefa separada.

---

## Resultado Esperado

1. **Modal Trial**: Apenas campos relevantes (limites, status, módulos)
2. **Card Trial na página pública**: Reflete os limites reais cadastrados no banco
3. **Nome Trial**: Protegido contra alteração acidental
4. **UX mais limpa**: Admin não vê campos irrelevantes para plano gratuito
