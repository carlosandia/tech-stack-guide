
# Plano: Máscara de Telefone + Normalização de Segmento

## Análise do Email

O sistema de email do Supabase Auth está **corretamente configurado**:
- Linha 227 do `organizacao.service.ts` usa `supabaseAdmin.auth.admin.inviteUserByEmail()`
- O SMTP é configurado no **Supabase Dashboard** > Authentication > Email Templates
- Nenhuma modificação é necessária

---

## Implementações Aprovadas

### 1. Máscara de Telefone no Step3Admin

**Arquivo:** `src/modules/admin/components/wizard/Step3Admin.tsx`

Adicionar import e handler similar ao Step1Empresa:

```typescript
// Adicionar import
import { formatTelefone } from '@/lib/formatters'

// Adicionar setValue no useFormContext
const {
  register,
  control,
  setValue,  // <-- adicionar
  formState: { errors },
} = useFormContext<CriarOrganizacaoData>()

// Adicionar handler
const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatTelefone(e.target.value)
  setValue('admin_telefone', formatted)
}

// No input de telefone (linha ~88-92):
<input
  type="tel"
  {...register('admin_telefone', { onChange: handleTelefoneChange })}
  placeholder="(11) 99999-9999"
  maxLength={15}
  className="..."
/>
```

---

### 2. Normalização de Segmento Outro

**Arquivo:** `src/lib/formatters.ts`

Adicionar nova função após `unformatCep`:

```typescript
/**
 * Normaliza texto removendo acentos e padronizando capitalização
 * Usado para evitar duplicatas em segmentos customizados
 * Ex: "marketing DIGITAL" -> "Marketing Digital"
 * Ex: "consultória" -> "Consultoria"
 */
export function normalizeSegmento(value: string): string {
  if (!value) return ''
  // Remove acentos usando normalização NFD
  const semAcento = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Capitaliza cada palavra
  return semAcento
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
```

**Arquivo:** `src/modules/admin/components/wizard/Step1Empresa.tsx`

Aplicar normalização no `onBlur` do campo:

```typescript
// Adicionar import
import { formatTelefone, formatCep, normalizeSegmento } from '@/lib/formatters'

// Adicionar handler
const handleSegmentoOutroBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const normalized = normalizeSegmento(e.target.value)
  setValue('segmento_outro', normalized)
}

// No input de segmento_outro (linha ~93-98):
<input
  type="text"
  {...register('segmento_outro')}
  onBlur={handleSegmentoOutroBlur}  // <-- adicionar
  placeholder="Ex: Consultoria Ambiental"
  className="..."
/>
```

---

## Resumo de Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/lib/formatters.ts` | Adicionar função `normalizeSegmento()` |
| `src/modules/admin/components/wizard/Step1Empresa.tsx` | Adicionar handler `onBlur` no campo segmento_outro |
| `src/modules/admin/components/wizard/Step3Admin.tsx` | Adicionar máscara de telefone com `formatTelefone` |

---

## Resultado Esperado

| Campo | Comportamento |
|-------|---------------|
| Telefone Admin | Formata automaticamente: `(11) 99999-9999` |
| Segmento Outro | Ao sair do campo, normaliza: `"marketing digital"` → `"Marketing Digital"` |
| Email de Convite | Continua usando Supabase Auth (já funciona) |
