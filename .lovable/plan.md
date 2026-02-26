

# Plano: Adicionar tooltips explicativos no Funil de Conversao

## O que sera feito

Adicionar um icone (?) sutil ao lado de cada titulo de etapa do funil (Leads, MQLs, SQLs, R. Agendadas, R. Realizadas, Ganhos) com Tooltip explicativo claro sobre o que cada metrica representa.

## Alteracoes

### Arquivo: `src/modules/app/components/dashboard/FunilConversao.tsx`

**1. Adicionar campo `tooltip` na interface `EtapaFunil` e nos dados de cada etapa:**

| Etapa | Tooltip |
|-------|---------|
| Leads | "Total de oportunidades criadas no periodo e funil selecionado. Representa o topo do funil." |
| MQLs | "Marketing Qualified Leads. Oportunidades que atenderam os criterios de qualificacao configurados e se tornaram leads qualificados para marketing." |
| SQLs | "Sales Qualified Leads. Leads que foram validados pela equipe comercial como prontos para abordagem de vendas." |
| R. Agendadas | "Reunioes agendadas com os leads qualificados. Indica o volume de conversas comerciais marcadas no periodo." |
| R. Realizadas | "Reunioes que foram efetivamente realizadas. Diferenca entre agendadas e realizadas indica taxa de no-show." |
| Ganhos | "Negocios fechados com sucesso. Oportunidades que passaram por todo o funil e foram convertidas em vendas." |

**2. Importar componentes de Tooltip do design system:**
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
```

**3. No header de cada card (desktop), adicionar o (?) ao lado do label:**
```tsx
<div className="flex items-center gap-1 mb-2">
  <div className={`w-7 h-7 rounded-lg ...`}>
    <Icon ... />
  </div>
  <span className="text-[10px] ...">{etapa.label}</span>
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="w-3 h-3 text-muted-foreground/40 hover:text-muted-foreground cursor-help shrink-0" />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[200px]">
      <p className="text-xs">{etapa.tooltip}</p>
    </TooltipContent>
  </Tooltip>
</div>
```

**4. Mesmo padrao no layout mobile (vertical cards).**

**5. Envolver todo o componente com `<TooltipProvider>`.**

**6. Ajuste de largura dos cards para evitar "estourar":**
- Reduzir padding dos cards de `p-3` para `p-2.5`
- Usar `min-w-0` nos flex items para permitir encolhimento
- Labels "R. Agendadas" e "R. Realizadas" ja estao abreviados, mantendo compactos

### Nao serao alterados
- Logica de calculo (ja esta correta)
- Layout geral (horizontal desktop / vertical mobile)
- Cores e icones existentes

