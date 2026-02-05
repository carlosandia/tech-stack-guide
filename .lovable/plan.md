
# Plano: Corrigir Criacao Completa de Organizacao

## Problemas Identificados

### 1. Campos faltantes no payload da API
A interface `CriarOrganizacaoPayload` em `admin.api.ts` nao inclui:
- `cortesia: boolean`
- `cortesia_motivo: string`

### 2. Modal nao envia campos de cortesia
O `NovaOrganizacaoModal.tsx` no `onSubmit` nao passa:
- `data.cortesia`
- `data.cortesia_motivo`

### 3. Assinatura nao e criada
A funcao `criarOrganizacao` cria organizacao e admin, mas **NAO** cria registro na tabela `assinaturas`. Os campos de cortesia devem ser salvos nesta tabela.

### 4. Validacao do Step2 faltando no STEPS
O array STEPS no modal nao inclui `cortesia` e `cortesia_motivo` nos campos da etapa 2.

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/admin/services/admin.api.ts` | Adicionar campos no payload + criar assinatura |
| `src/modules/admin/components/NovaOrganizacaoModal.tsx` | Passar cortesia no submit + adicionar campos no STEPS |

---

## Correcoes Detalhadas

### 1. CriarOrganizacaoPayload (admin.api.ts linha 44-67)

Adicionar:
```typescript
export interface CriarOrganizacaoPayload {
  // ... campos existentes ...
  cortesia?: boolean           // ADICIONAR
  cortesia_motivo?: string     // ADICIONAR
}
```

### 2. Funcao criarOrganizacao (admin.api.ts)

Apos criar organizacao e admin, adicionar criacao da assinatura:

```typescript
// Apos criar admin (linha 356)...

// Criar assinatura vinculada
const agora = new Date()
const { error: assinaturaError } = await supabase
  .from('assinaturas')
  .insert([{
    organizacao_id: org.id,
    plano_id: payload.plano_id,
    status: isTrial ? 'trial' : 'ativa',
    periodo: 'mensal',
    inicio_em: agora.toISOString(),
    cortesia: payload.cortesia ?? false,
    cortesia_motivo: payload.cortesia ? payload.cortesia_motivo : null,
    trial_inicio: isTrial ? agora.toISOString() : null,
    trial_fim: isTrial 
      ? new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() 
      : null,
  }])

if (assinaturaError) {
  // Rollback: deletar admin e organizacao
  await supabase.from('usuarios').delete().eq('id', adminUser.id)
  await supabase.from('organizacoes_saas').delete().eq('id', org.id)
  throw new Error(`Erro ao criar assinatura: ${assinaturaError.message}`)
}
```

### 3. NovaOrganizacaoModal.tsx - STEPS array (linha 30-34)

Adicionar campos de cortesia na etapa 2:

```typescript
const STEPS = [
  { id: 1, label: 'Empresa', fields: ['nome', 'segmento', 'segmento_outro', 'email', 'website', 'telefone', 'endereco'] },
  { id: 2, label: 'Plano', fields: ['plano_id', 'cortesia', 'cortesia_motivo'] },  // ADICIONAR cortesia
  { id: 3, label: 'Admin', fields: ['admin_nome', 'admin_sobrenome', 'admin_email', 'admin_telefone', 'enviar_convite', 'senha_inicial'] },
] as const
```

### 4. NovaOrganizacaoModal.tsx - onSubmit (linha 84-109)

Adicionar campos no payload:

```typescript
const onSubmit = (data: CriarOrganizacaoData) => {
  criarOrganizacao(
    {
      nome: data.nome,
      segmento: data.segmento,
      segmento_outro: data.segmento_outro,
      email: data.email,
      website: data.website || undefined,
      telefone: data.telefone || undefined,
      endereco: data.endereco,
      plano_id: data.plano_id,
      cortesia: data.cortesia,                    // ADICIONAR
      cortesia_motivo: data.cortesia_motivo,      // ADICIONAR
      admin_nome: data.admin_nome,
      admin_sobrenome: data.admin_sobrenome,
      admin_email: data.admin_email,
      admin_telefone: data.admin_telefone || undefined,
      enviar_convite: data.enviar_convite,
      senha_inicial: data.senha_inicial || undefined,
    },
    { ... }
  )
}
```

### 5. defaultValues no useForm (linha 42-56)

Adicionar valores default:

```typescript
defaultValues: {
  // ... existentes ...
  cortesia: false,         // ADICIONAR
  cortesia_motivo: '',     // ADICIONAR
}
```

---

## Fluxo Corrigido

```text
Wizard Etapa 1: Empresa
  -> nome, segmento, email, telefone, website, endereco (cep, logradouro, etc)

Wizard Etapa 2: Plano
  -> plano_id, cortesia, cortesia_motivo

Wizard Etapa 3: Admin
  -> admin_nome, admin_sobrenome, admin_email, admin_telefone, enviar_convite

Submit:
  1. Buscar dados do plano selecionado
  2. INSERT organizacoes_saas (todos campos de endereco)
  3. INSERT usuarios (admin com role='admin')
  4. INSERT assinaturas (plano_id, cortesia, cortesia_motivo, status)
  5. Retornar IDs criados
```

---

## Verificacao pos-implementacao

Criar organizacao de teste e verificar no banco:
- `organizacoes_saas`: endereco_cep, endereco_logradouro, etc preenchidos
- `usuarios`: admin vinculado com organizacao_id
- `assinaturas`: cortesia=true, cortesia_motivo preenchido, plano_id correto
