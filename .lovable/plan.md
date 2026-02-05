
# Plano: Correcao da Cortesia no Wizard + Sistema de Bloqueio

## Problema Identificado

O toggle de "Cortesia" **nao foi implementado** no arquivo `Step2Expectativas.tsx`. O codigo atual nao possui os campos `cortesia` e `cortesia_motivo` - apenas a selecao de plano.

---

## Parte 1: Corrigir o Wizard de Criacao

### Mudancas em `Step2Expectativas.tsx`

Adicionar abaixo da selecao de planos:

```text
+------------------------------------------+
| [Selecao de Planos - ja existe]          |
+------------------------------------------+
| [x] Conceder como cortesia (sem cobranca)|
|     Motivo: [___________________________]|
+------------------------------------------+
```

**Comportamento:**
- Toggle aparece apenas quando plano pago e selecionado (preco > 0)
- Campo "Motivo" obrigatorio quando cortesia ativa
- Badge visual no card do plano quando cortesia marcada

### Mudancas no Schema

Atualizar `organizacao.schema.ts` para incluir:
- `cortesia: z.boolean().default(false)`
- `cortesia_motivo: z.string().optional()`
- Validacao refinada

---

## Parte 2: Sistema de Bloqueio de Organizacao

### Conceito

O Super Admin pode **revogar a cortesia** de uma organizacao. Quando isso acontece:

1. A organizacao fica com status `bloqueada`
2. Usuarios dessa organizacao veem uma **tela de bloqueio**
3. Para desbloquear, precisam escolher um plano e pagar

### Fluxo Visual

```text
Super Admin revoga cortesia
         |
         v
   +-----------------------+
   | org.status = bloqueada|
   +-----------------------+
         |
         v
Usuario tenta acessar o sistema
         |
         v
   +---------------------------+
   | Tela de Bloqueio          |
   | "Seu acesso foi suspenso" |
   | [Ver Planos]              |
   +---------------------------+
         |
         v
   Pagina publica de planos
         |
         v
   Checkout Stripe
         |
         v
   Status volta para "ativa"
```

### Banco de Dados

A tabela `assinaturas` ja possui campo `status`. Adicionar valor `bloqueada`:

```sql
-- Status possiveis: ativa, cancelada, trial_expirado, bloqueada
```

### Arquivos a Modificar

#### Frontend
1. **`Step2Expectativas.tsx`** - Adicionar toggle de cortesia
2. **`organizacao.schema.ts`** - Adicionar campos cortesia ao schema
3. **`OrganizacaoConfigTab.tsx`** - Botao "Revogar Cortesia"
4. **`BlockedPage.tsx`** (novo) - Tela de bloqueio
5. **`AuthProvider.tsx`** - Verificar status da organizacao

#### Backend
6. **API** - Endpoint para revogar cortesia

---

## Detalhamento Tecnico

### 1. Step2Expectativas.tsx (Toggle de Cortesia)

```typescript
// Apos grid de planos, adicionar:
{selectedPlano && selectedPlano.preco_mensal > 0 && (
  <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={cortesia}
        onChange={(e) => {
          setValue('cortesia', e.target.checked)
          if (!e.target.checked) setValue('cortesia_motivo', '')
        }}
        className="toggle"
      />
      <div>
        <span className="font-medium">Conceder como cortesia</span>
        <p className="text-xs text-muted-foreground">
          Organizacao usara o plano sem cobranca
        </p>
      </div>
    </label>
    
    {cortesia && (
      <textarea
        placeholder="Motivo da cortesia (obrigatorio)"
        {...register('cortesia_motivo')}
        className="mt-3 w-full input"
      />
    )}
  </div>
)}
```

### 2. OrganizacaoConfigTab.tsx (Revogar Cortesia)

Adicionar botao na secao de plano quando cortesia ativa:

```typescript
{org.cortesia && (
  <button
    onClick={handleRevogarCortesia}
    className="btn-destructive-outline"
  >
    Revogar Cortesia
  </button>
)}
```

### 3. BlockedPage.tsx (Nova Pagina)

Tela fullscreen exibida quando organizacao bloqueada:

```text
+--------------------------------+
|         [Logo CRM]             |
|                                |
|   Acesso Suspenso              |
|                                |
|   Sua organizacao foi          |
|   bloqueada. Para continuar,   |
|   escolha um plano.            |
|                                |
|   [Ver Planos Disponiveis]     |
|                                |
+--------------------------------+
```

### 4. AuthProvider.tsx (Verificacao)

No carregamento do usuario, verificar status:

```typescript
if (organizacao.status === 'bloqueada') {
  navigate('/bloqueado')
}
```

---

## Sequencia de Implementacao

1. Atualizar schema Zod com campos cortesia
2. Implementar toggle no Step2Expectativas
3. Criar pagina BlockedPage
4. Adicionar botao "Revogar Cortesia" na aba de config
5. Implementar verificacao no AuthProvider
6. Endpoint de revogacao no backend (se necessario)

---

## Resultado Final

| Cenario | Comportamento |
|---------|---------------|
| Criar org com cortesia | Toggle + motivo no wizard |
| Ver org com cortesia | Badge verde + motivo na config |
| Revogar cortesia | Status vira "bloqueada" |
| Usuario tenta acessar org bloqueada | Ve tela de bloqueio |
| Usuario paga | Status volta "ativa" |
