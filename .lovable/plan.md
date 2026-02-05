
# Plano: Substituir Etapa 2 (Expectativas) por Seleção de Plano

## Resumo

Transformar a Etapa 2 do wizard de criação de organização para exibir apenas um seletor de plano, removendo os campos de expectativas que não são salvos no banco de dados.

---

## Análise da Situação Atual

| Item | Status | Observação |
|------|--------|------------|
| Campos de expectativa no frontend | ✅ Existem | 5 campos: numero_usuarios, volume_leads_mes, etc. |
| Colunas no banco `organizacoes_saas` | ❌ NÃO existem | Tabela só tem coluna `plano` (varchar) |
| Uso dos dados | ❌ Não são salvos | Enviados mas ignorados no insert |

**Conclusão**: Os campos de expectativas nunca foram persistidos - podem ser removidos sem impacto.

---

## O Que Será Feito

### 1. Modificar Step2Expectativas.tsx

Trocar os 5 campos atuais por um único seletor de plano com cards visuais.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ETAPA 2 - ESCOLHA DO PLANO                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Selecione o plano para esta organização:                                   │
│                                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │  ○ Trial        │ │  ○ Starter      │ │  ○ Pro          │                │
│  │  Grátis         │ │  R$ 99/mês      │ │  R$ 249/mês     │                │
│  │  2 usuários     │ │  5 usuários     │ │  15 usuários    │                │
│  │  100 oport.     │ │  500 oport.     │ │  Ilimitado      │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │  ○ Enterprise   │                                                         │
│  │  R$ 599/mês     │                                                         │
│  │  50 usuários    │                                                         │
│  │  Ilimitado      │                                                         │
│  └─────────────────┘                                                         │
│                                                                              │
│  Card selecionado: borda azul + background suave                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Atualizar Schema Zod

**Remover** do `Step2ExpectativasSchema`:
- `numero_usuarios`
- `volume_leads_mes`
- `principal_objetivo`
- `como_conheceu`
- `observacoes`

**Adicionar**:
- `plano_id: z.string().min(1, 'Selecione um plano')`

### 3. Atualizar NovaOrganizacaoModal.tsx

- Remover campos de expectativa dos `defaultValues`
- Adicionar `plano_id: ''` aos defaults
- Atualizar array `STEPS[1].fields` para `['plano_id']`
- No submit, usar `plano_id` para buscar o nome do plano e salvar na organização

### 4. Atualizar admin.api.ts

- Remover campos de expectativa do `CriarOrganizacaoPayload`
- Adicionar `plano_id: string`
- Na função `criarOrganizacao`, buscar o plano pelo ID para obter:
  - Nome do plano (para salvar na coluna `plano`)
  - Limites (para copiar para a organização)

### 5. Remover constantes não utilizadas

Do arquivo `organizacao.schema.ts`, remover:
- `NUMERO_USUARIOS`
- `VOLUME_LEADS`
- `OBJETIVOS`
- `COMO_CONHECEU`

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/components/wizard/Step2Expectativas.tsx` | Substituir campos por seletor de planos |
| `src/modules/admin/schemas/organizacao.schema.ts` | Remover campos antigos, adicionar `plano_id` |
| `src/modules/admin/components/NovaOrganizacaoModal.tsx` | Atualizar defaults e STEPS |
| `src/modules/admin/services/admin.api.ts` | Atualizar payload e lógica de criação |

---

## Detalhes Técnicos

### Novo Step2Expectativas.tsx

```tsx
import { useFormContext } from 'react-hook-form'
import { usePlanos } from '../../hooks/usePlanos'
import { Check } from 'lucide-react'
import type { CriarOrganizacaoData } from '../../schemas/organizacao.schema'

export function Step2Expectativas() {
  const { watch, setValue, formState: { errors } } = useFormContext<CriarOrganizacaoData>()
  const { data: planos, isLoading } = usePlanos()
  
  const selectedPlanoId = watch('plano_id')

  const formatLimit = (value: number | null) => {
    if (value === null || value === -1) return 'Ilimitado'
    return value.toString()
  }

  const formatPrice = (preco: number) => {
    if (preco === 0) return 'Grátis'
    return `R$ ${preco.toFixed(0)}/mês`
  }

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Carregando planos...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Selecione o plano <span className="text-destructive">*</span>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {planos?.map((plano) => {
            const isSelected = selectedPlanoId === plano.id
            const isTrial = plano.nome.toLowerCase() === 'trial'
            
            return (
              <button
                key={plano.id}
                type="button"
                onClick={() => setValue('plano_id', plano.id, { shouldValidate: true })}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 bg-background'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
                
                <div className="font-semibold text-foreground">{plano.nome}</div>
                <div className={`text-lg font-bold ${isTrial ? 'text-green-600' : 'text-primary'}`}>
                  {formatPrice(plano.preco_mensal)}
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>{formatLimit(plano.limite_usuarios)} usuários</div>
                  <div>{formatLimit(plano.limite_oportunidades)} oportunidades</div>
                </div>
              </button>
            )
          })}
        </div>
        
        {errors.plano_id && (
          <p className="mt-2 text-sm text-destructive">{errors.plano_id.message}</p>
        )}
      </div>
    </div>
  )
}
```

### Novo Step2ExpectativasSchema

```tsx
export const Step2ExpectativasSchema = z.object({
  plano_id: z.string().min(1, 'Selecione um plano'),
})
```

### Atualização do CriarOrganizacaoPayload

```tsx
export interface CriarOrganizacaoPayload {
  nome: string
  segmento: string
  email?: string
  website?: string
  telefone?: string
  endereco?: { ... }
  plano_id: string  // Novo campo - ID do plano selecionado
  admin_nome: string
  admin_sobrenome: string
  admin_email: string
  admin_telefone?: string
  enviar_convite: boolean
  senha_inicial?: string
}
```

### Atualização da função criarOrganizacao

```tsx
export async function criarOrganizacao(payload: CriarOrganizacaoPayload): Promise<...> {
  // Buscar dados do plano selecionado
  const { data: plano, error: planoError } = await supabase
    .from('planos')
    .select('nome, limite_usuarios, limite_oportunidades, limite_storage_mb')
    .eq('id', payload.plano_id)
    .single()

  if (planoError || !plano) throw new Error('Plano não encontrado')

  // Criar organização com dados do plano
  const { data: org, error: orgError } = await supabase
    .from('organizacoes_saas')
    .insert([{
      nome: payload.nome,
      slug: ...,
      segmento: payload.segmento,
      email: payload.email || 'sem-email@placeholder.local',
      plano: plano.nome.toLowerCase(),  // Salva o nome do plano
      status: plano.nome.toLowerCase() === 'trial' ? 'trial' : 'ativa',
      limite_usuarios: plano.limite_usuarios,
      limite_oportunidades: plano.limite_oportunidades,
      limite_storage_mb: plano.limite_storage_mb,
      // ... demais campos de endereço
    }])
    .select()
    .single()

  // ...
}
```

---

## Impacto no Banco de Dados

**Nenhuma migração necessária** - os campos de expectativas nunca existiram no banco.

---

## Resultado Esperado

1. **Etapa 2 simplificada**: Apenas seleção visual de plano
2. **Dados consistentes**: Plano e limites vêm da tabela `planos`
3. **Código mais limpo**: Removidas constantes e campos não utilizados
4. **UX melhorada**: Cards visuais com preço e limites claros
