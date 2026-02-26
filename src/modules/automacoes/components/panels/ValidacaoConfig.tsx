/**
 * AIDEV-NOTE: Painel de configuração do nó Validação (Parte 2 do PRD Melhorias)
 * Avalia conteúdo textual da última resposta recebida do contato
 */

import { Plus, Trash2 } from 'lucide-react'
import { VALIDACAO_OPERADORES, VALIDACAO_TIPOS_CONTEUDO } from '../../schemas/automacoes.schema'
import { toast } from 'sonner'

// AIDEV-NOTE: Seg — validação básica de regex para prevenir ReDoS
function isRegexSegura(pattern: string): boolean {
  if (!pattern) return true
  try {
    // Rejeitar padrões com backtracking catastrófico
    if (/(\(.*\+\).*\+|\(.*\*\).*\+|\(\w+\|\w+\)[*+])/.test(pattern)) return false
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

interface ValidacaoCondicaoLocal {
  operador: string
  tipo_conteudo: string
  valor: string
  valor_min?: number
  valor_max?: number
}

interface ValidacaoConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

const emptyCondicao = (): ValidacaoCondicaoLocal => ({
  operador: '',
  tipo_conteudo: '',
  valor: '',
})

export function ValidacaoConfig({ data, onUpdate }: ValidacaoConfigProps) {
  const condicoes = (data.condicoes as ValidacaoCondicaoLocal[]) || [emptyCondicao()]

  const updateCondicao = (index: number, patch: Partial<ValidacaoCondicaoLocal>) => {
    const updated = condicoes.map((c, i) => (i === index ? { ...c, ...patch } : c))
    onUpdate({ ...data, condicoes: updated })
  }

  const addCondicao = () => {
    onUpdate({ ...data, condicoes: [...condicoes, emptyCondicao()] })
  }

  const removeCondicao = (index: number) => {
    if (condicoes.length <= 1) return
    onUpdate({ ...data, condicoes: condicoes.filter((_, i) => i !== index) })
  }

  const showValor = (op: string) =>
    ['iguais', 'desiguais', 'contem', 'nao_contem', 'comprimento', 'expressao_regular'].includes(op)

  const showFaixa = (tipo: string) => tipo === 'faixa_numeros'

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Configurar Validação</label>
        <p className="text-xs text-muted-foreground mb-3">
          Avalia o conteúdo da última mensagem recebida do contato
        </p>
      </div>

      {condicoes.map((cond, index) => (
        <div key={index} className="space-y-3 p-3 bg-violet-50/50 rounded-lg border border-violet-200/50 relative">
          {condicoes.length > 1 && (
            <button
              onClick={() => removeCondicao(index)}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
              title="Remover regra"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {index > 0 && (
            <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">E (AND)</p>
          )}

          {/* Operador */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Operador</label>
            <select
              value={cond.operador}
              onChange={e => updateCondicao(index, { operador: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Selecione...</option>
              {VALIDACAO_OPERADORES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo de conteúdo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo de conteúdo</label>
            <select
              value={cond.tipo_conteudo}
              onChange={e => updateCondicao(index, { tipo_conteudo: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Qualquer</option>
              {VALIDACAO_TIPOS_CONTEUDO.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Valor (condicional) */}
          {showValor(cond.operador) && !showFaixa(cond.tipo_conteudo) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor</label>
              <input
                type="text"
                value={cond.valor}
                onChange={e => {
                  // AIDEV-NOTE: Seg — validar regex antes de salvar para prevenir ReDoS
                  if (cond.operador === 'expressao_regular' && e.target.value && !isRegexSegura(e.target.value)) {
                    toast.error('Expressão regular inválida ou potencialmente perigosa')
                    return
                  }
                  updateCondicao(index, { valor: e.target.value })
                }}
                placeholder={cond.operador === 'expressao_regular' ? 'Ex: ^[0-9]+$' : 'Digite o valor...'}
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Faixa numérica */}
          {showFaixa(cond.tipo_conteudo) && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">Mín</label>
                <input
                  type="number"
                  value={cond.valor_min ?? ''}
                  onChange={e => updateCondicao(index, { valor_min: parseInt(e.target.value) || 0 })}
                  placeholder="1"
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">Máx</label>
                <input
                  type="number"
                  value={cond.valor_max ?? ''}
                  onChange={e => updateCondicao(index, { valor_max: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addCondicao}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-md border border-dashed border-violet-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Adicionar regra (e)
      </button>
    </div>
  )
}
