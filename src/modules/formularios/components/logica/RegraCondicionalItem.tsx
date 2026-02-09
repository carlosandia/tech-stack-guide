/**
 * AIDEV-NOTE: Item individual de uma regra condicional
 */

import { Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RegraCondicional, CampoFormulario } from '../../services/formularios.api'

interface Props {
  regra: RegraCondicional
  campos: CampoFormulario[]
  onToggle: (regraId: string, ativa: boolean) => void
  onDelete: (regraId: string) => void
  onEdit: (regra: RegraCondicional) => void
  expanded: boolean
  onToggleExpand: () => void
}

const TIPO_ACAO_LABELS: Record<string, string> = {
  mostrar: 'Mostrar campo',
  ocultar: 'Ocultar campo',
  pular_etapa: 'Pular para etapa',
  redirecionar: 'Redirecionar',
  definir_valor: 'Definir valor',
}

const OPERADOR_LABELS: Record<string, string> = {
  igual: '=',
  diferente: '≠',
  contem: 'contém',
  nao_contem: 'não contém',
  maior: '>',
  menor: '<',
  vazio: 'vazio',
  nao_vazio: 'não vazio',
}

export function RegraCondicionalItem({ regra, campos, onToggle, onDelete, onEdit, expanded, onToggleExpand }: Props) {
  const campoAlvo = campos.find((c) => c.id === regra.campo_alvo_id)

  const getCampoLabel = (campoId: string) => {
    const campo = campos.find((c) => c.id === campoId)
    return campo?.label || campoId
  }

  return (
    <div className={`border rounded-lg transition-colors ${regra.ativa ? 'border-border' : 'border-border/50 opacity-60'}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => onToggle(regra.id, !regra.ativa)} className="shrink-0">
          {regra.ativa ? (
            <ToggleRight className="w-5 h-5 text-primary" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <button onClick={onToggleExpand} className="flex-1 text-left flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{regra.nome_regra}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {TIPO_ACAO_LABELS[regra.tipo_acao] || regra.tipo_acao}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0 text-muted-foreground" />}
        </button>

        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onDelete(regra.id)}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
          {/* Condições */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Quando {regra.logica_condicoes === 'OU' ? 'qualquer' : 'todas'} condição(ões):
            </p>
            {(regra.condicoes || []).map((cond, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-foreground bg-muted/50 rounded px-2 py-1">
                <span className="font-medium">{getCampoLabel(cond.campo_id)}</span>
                <span className="text-muted-foreground">{OPERADOR_LABELS[cond.operador] || cond.operador}</span>
                {cond.valor && <span className="font-medium">"{cond.valor}"</span>}
                {i < (regra.condicoes || []).length - 1 && (
                  <span className="text-muted-foreground ml-1">{regra.logica_condicoes}</span>
                )}
              </div>
            ))}
          </div>

          {/* Ação */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{TIPO_ACAO_LABELS[regra.tipo_acao]}:</span>{' '}
            {campoAlvo ? campoAlvo.label : regra.url_redirecionamento_alvo || regra.valor_alvo || `Etapa ${regra.indice_etapa_alvo}`}
          </div>

          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onEdit(regra)}>
            Editar regra
          </Button>
        </div>
      )}
    </div>
  )
}
