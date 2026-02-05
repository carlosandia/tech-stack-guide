

# Plano: Correções no Modal de Nova Organização

## Resumo das Correções Solicitadas

1. **Campo "Outro" para Segmento**: Quando selecionar "Outro", exibir campo de texto para especificar
2. **Email não obrigatório**: Remover obrigatoriedade do campo email
3. **Máscaras de input**: Implementar máscaras para telefone e CEP
4. **Auto-preenchimento via CEP**: Consultar API de CEP para preencher endereço automaticamente

---

## Análise do Banco de Dados

Analisei a tabela `organizacoes_saas` no Supabase:

| Coluna Existente | Tipo |
|-----------------|------|
| `segmento` | `string \| null` |
| `email` | `string` (obrigatório no schema atual) |
| `endereco_cep` | `string \| null` |
| `endereco_logradouro` | `string \| null` |
| `endereco_bairro` | `string \| null` |
| `endereco_cidade` | `string \| null` |
| `endereco_estado` | `string \| null` |

**Observação sobre "Segmento Outro"**: A coluna `segmento` já suporta texto livre (é `string | null`). Podemos armazenar o valor personalizado diretamente nela (ex: "outro:Consultoria Ambiental") ou criar uma convenção para isso. **Não é necessário criar nova coluna** - podemos usar uma abordagem de prefixo ou armazenar o texto personalizado diretamente.

---

## Solução Técnica

### 1. Campo "Outro" para Segmento

**Abordagem**: Quando o usuário seleciona "Outro", exibir um campo de texto adicional. O valor será armazenado como texto livre na coluna `segmento` existente.

```tsx
// Lógica no Step1Empresa.tsx
const segmento = watch('segmento')

{segmento === 'outro' && (
  <input 
    type="text"
    {...register('segmento_outro')}
    placeholder="Especifique o segmento..."
  />
)}
```

**Alteração no Schema**:
```ts
// organizacao.schema.ts
segmento: z.string().min(1, 'Selecione um segmento'),
segmento_outro: z.string().optional(),
```

**Na submissão**: Se `segmento === 'outro'` e `segmento_outro` estiver preenchido, enviar `segmento_outro` como valor do segmento.

---

### 2. Email Não Obrigatório

**Alteração no Schema**:
```ts
// Antes
email: z.string().email('Email invalido'),

// Depois
email: z.string().email('Email invalido').optional().or(z.literal('')),
```

**Alteração no Componente**: Remover o asterisco `*` do label

---

### 3. Máscaras de Input

Como não há biblioteca de máscara instalada, implementaremos máscaras customizadas usando funções de formatação:

**Telefone**: `(99) 99999-9999`
```ts
function formatTelefone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0,2)}) ${numbers.slice(2)}`
  return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`
}
```

**CEP**: `00000-000`
```ts
function formatCep(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 8)
  if (numbers.length <= 5) return numbers
  return `${numbers.slice(0,5)}-${numbers.slice(5)}`
}
```

---

### 4. Auto-preenchimento via CEP

**API Recomendada**: **ViaCEP** (gratuita, sem autenticação, brasileira)
- URL: `https://viacep.com.br/ws/{cep}/json/`
- Retorna: logradouro, bairro, localidade (cidade), uf (estado)

**Implementação**:
```ts
async function buscarEnderecoPorCep(cep: string) {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null
  
  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
  const data = await response.json()
  
  if (data.erro) return null
  
  return {
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    estado: data.uf,
  }
}
```

**No componente**:
- Ao digitar CEP completo (8 dígitos), chamar API
- Mostrar loading enquanto busca
- Preencher campos automaticamente
- Permitir edição manual após auto-preenchimento

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/schemas/organizacao.schema.ts` | Adicionar `segmento_outro`, tornar `email` opcional |
| `src/modules/admin/components/wizard/Step1Empresa.tsx` | Campo "Outro" para segmento, máscaras, busca CEP |
| `src/modules/admin/components/NovaOrganizacaoModal.tsx` | Ajustar payload de submissão |
| `src/modules/admin/services/admin.api.ts` | Ajustar tipo do payload |
| `src/lib/utils.ts` | Adicionar funções de formatação (máscaras) |

---

## Detalhes de Implementação

### Novo Hook: `useCepLookup`

```ts
// src/modules/admin/hooks/useCepLookup.ts
export function useCepLookup() {
  const [isLoading, setIsLoading] = useState(false)
  
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return null
    
    setIsLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (data.erro) return null
      return {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return { buscarCep, isLoading }
}
```

### Componente CEP com Auto-Preenchimento

```tsx
// Dentro de Step1Empresa.tsx
const { buscarCep, isLoading: buscandoCep } = useCepLookup()
const { setValue, watch } = useFormContext()
const cep = watch('endereco.cep')

const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatCep(e.target.value)
  setValue('endereco.cep', formatted)
  
  // Se tem 9 caracteres (00000-000), buscar
  if (formatted.length === 9) {
    const endereco = await buscarCep(formatted)
    if (endereco) {
      setValue('endereco.logradouro', endereco.logradouro)
      setValue('endereco.bairro', endereco.bairro)
      setValue('endereco.cidade', endereco.cidade)
      setValue('endereco.estado', endereco.estado)
    }
  }
}
```

---

## UX Esperada

### Campo Segmento "Outro"
```
┌─────────────────────────────────────┐
│ Segmento *                          │
│ ┌─────────────────────────────────┐ │
│ │ Outro                      ▾  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Especifique o segmento *            │  ← Aparece só quando "Outro"
│ ┌─────────────────────────────────┐ │
│ │ Consultoria Ambiental          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### CEP com Auto-Preenchimento
```
┌─────────────────────────────────────┐
│ CEP                                 │
│ ┌─────────────────────────────────┐ │
│ │ 01310-100                   ⟳  │ │ ← Loading indicator
│ └─────────────────────────────────┘ │
│                                     │
│ Logradouro (preenchido)             │
│ ┌─────────────────────────────────┐ │
│ │ Avenida Paulista (auto)        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Checklist de Implementação

- [ ] Atualizar `organizacao.schema.ts`:
  - [ ] Adicionar campo `segmento_outro`
  - [ ] Tornar `email` opcional
  - [ ] Validação condicional: se `segmento === 'outro'`, `segmento_outro` é obrigatório

- [ ] Criar `src/lib/formatters.ts`:
  - [ ] `formatTelefone(value: string): string`
  - [ ] `formatCep(value: string): string`

- [ ] Criar `src/modules/admin/hooks/useCepLookup.ts`

- [ ] Atualizar `Step1Empresa.tsx`:
  - [ ] Campo "Outro" condicional para segmento
  - [ ] Máscara de telefone com `onChange` customizado
  - [ ] Máscara de CEP com auto-preenchimento
  - [ ] Loading indicator no campo CEP
  - [ ] Remover asterisco do Email

- [ ] Atualizar `NovaOrganizacaoModal.tsx`:
  - [ ] Ajustar `onSubmit` para usar `segmento_outro` quando aplicável

- [ ] Atualizar `admin.api.ts`:
  - [ ] Tornar `email` opcional no tipo `CriarOrganizacaoPayload`

