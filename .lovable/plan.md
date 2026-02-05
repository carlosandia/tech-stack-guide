
# Plano: Sistema de Cortesia/Concessao Gratuita de Planos

## Contexto
Quando o Super Admin cria uma organizacao pelo wizard e atribui um plano pago (ex: Starter), atualmente nao ha forma de indicar que essa organizacao esta usando o plano **sem pagar** - uma cortesia ou concessao interna.

## Solucao Recomendada

### Abordagem: Campo "Cortesia" na Tabela `assinaturas`

Adicionar um campo booleano `cortesia` (ou `is_gratuito`) na tabela `assinaturas` que indica explicitamente que a organizacao nao paga por aquele plano.

---

## Mudancas Propostas

### 1. Banco de Dados
Adicionar coluna na tabela `assinaturas`:

```text
ALTER TABLE assinaturas 
ADD COLUMN cortesia BOOLEAN DEFAULT FALSE,
ADD COLUMN cortesia_motivo TEXT;
```

- `cortesia`: Indica se e uma concessao gratuita
- `cortesia_motivo`: Motivo/justificativa (auditoria)

### 2. Wizard de Criacao (Step 2)
Quando o Super Admin seleciona um plano **pago**, exibir um toggle:

```text
+------------------------------------------+
| [x] Conceder como cortesia (sem cobranca)|
|     Motivo: [___________________________]|
+------------------------------------------+
```

- Toggle aparece apenas para planos com preco > 0
- Se marcado, o campo de motivo e obrigatorio

### 3. Listagem de Organizacoes
Na lista de organizacoes, exibir badge diferenciado:

```text
| Empresa ABC | Starter | [Cortesia] |
| Empresa XYZ | Starter | [Pago]     |
```

### 4. Detalhes da Organizacao
Na aba de configuracoes, mostrar claramente:

```text
Plano: Starter
Tipo: Cortesia (concedido em 05/02/2026)
Motivo: "Parceiro estrategico"
```

### 5. Cards de Plano no Wizard
Quando cortesia estiver marcada, exibir indicacao visual:

```text
+-------------------+
|    Starter        |
|  R$ 99/mes        |
|   Cortesia        | <-- badge verde
+-------------------+
```

---

## Fluxo Visual

```text
Super Admin seleciona "Starter (R$ 99/mes)"
           |
           v
    +------------------------+
    | Plano pago detectado   |
    +------------------------+
           |
           v
    [ ] Conceder como cortesia?
           |
     Sim   |   Nao
     v     v    v
  Badge   Assinatura
"Cortesia" normal
```

---

## Arquivos a Modificar

### Backend
1. `supabase/migrations/` - Nova coluna
2. `backend/src/services/organizacao.service.ts` - Salvar flag cortesia
3. `backend/src/schemas/admin.ts` - Adicionar campo no schema

### Frontend
4. `src/modules/admin/schemas/organizacao.schema.ts` - Adicionar campos
5. `src/modules/admin/components/wizard/Step2Expectativas.tsx` - Toggle de cortesia
6. `src/modules/admin/pages/OrganizacoesPage.tsx` - Badge na listagem
7. `src/modules/admin/components/OrganizacaoConfigTab.tsx` - Exibir info cortesia
8. `src/integrations/supabase/types.ts` - Atualizar tipos

---

## Beneficios
- **Clareza**: Fica explicito que a organizacao usa o plano sem pagar
- **Auditoria**: Motivo registrado para compliance
- **Gestao**: Super Admin pode filtrar organizacoes por "Cortesia" vs "Pago"
- **Relatorios**: Diferenciar receita real de concessoes

---

## Secao Tecnica

### Schema Zod Atualizado
```typescript
export const Step2ExpectativasSchema = z.object({
  plano_id: z.string().min(1, 'Selecione um plano'),
  cortesia: z.boolean().default(false),
  cortesia_motivo: z.string().optional(),
}).refine(
  (data) => {
    if (data.cortesia) {
      return data.cortesia_motivo && data.cortesia_motivo.trim().length >= 3
    }
    return true
  },
  {
    message: 'Informe o motivo da cortesia',
    path: ['cortesia_motivo'],
  }
)
```

### Interface Assinatura
```typescript
interface Assinatura {
  // ... campos existentes
  cortesia: boolean
  cortesia_motivo: string | null
}
```
