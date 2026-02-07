/**
 * AIDEV-NOTE: Aba Qualificação da configuração de pipeline
 * Conforme PRD-07 RF-08 - Regras MQL
 */

import { useState } from 'react'
import { Plus, Trash2, Search, ShieldCheck, Info } from 'lucide-react'
import { useRegrasVinculadas, useRegrasDisponiveis, useVincularRegra, useDesvincularRegra } from '../../hooks/usePipelineConfig'
import { useTodosCampos } from '@/modules/configuracoes/hooks/useCampos'

interface Props {
  funilId: string
}

const OPERADOR_LABEL: Record<string, string> = {
  igual: 'É igual a',
  diferente: 'Não é igual a',
  contem: 'Contém',
  nao_contem: 'Não contém',
  maior_que: 'Maior que',
  menor_que: 'Menor que',
  maior_igual: 'Maior ou igual',
  menor_igual: 'Menor ou igual',
  vazio: 'Está vazio',
  nao_vazio: 'Não está vazio',
}

export function ConfigQualificacao({ funilId }: Props) {
  const { data: vinculadas, isLoading } = useRegrasVinculadas(funilId)
  const { data: disponiveis } = useRegrasDisponiveis()
  const vincular = useVincularRegra(funilId)
  const desvincular = useDesvincularRegra(funilId)

  const { mapaCampos } = useTodosCampos()

  const [showAdd, setShowAdd] = useState(false)
  const [busca, setBusca] = useState('')

  const vinculadasIds = new Set((vinculadas || []).map(v => v.regra_id))

  const regrasFiltradas = (disponiveis || [])
    .filter(r => !vinculadasIds.has(r.id))
    .filter(r => !busca || r.nome.toLowerCase().includes(busca.toLowerCase()))

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Qualificação (MQL)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defina regras para qualificar leads automaticamente
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Adicionar Regra
        </button>
      </div>

      {/* Regras vinculadas */}
      <div className="space-y-1.5">
        {(vinculadas || []).length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-lg">
            <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma regra configurada. Adicione regras para qualificação automática.
            </p>
          </div>
        ) : (
          (vinculadas || []).map(vinculo => (
            <div
              key={vinculo.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {vinculo.regra?.nome || 'Regra'}
                </div>
                {vinculo.regra && (
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {vinculo.regra.descricao || (
                      <>
                        {vinculo.regra.campo_id && mapaCampos.has(vinculo.regra.campo_id) && (
                          <span className="bg-muted px-1.5 py-0.5 rounded">
                            {mapaCampos.get(vinculo.regra.campo_id)!.entidadeLabel} › {mapaCampos.get(vinculo.regra.campo_id)!.nome}
                          </span>
                        )}
                        <span>{OPERADOR_LABEL[vinculo.regra.operador] || vinculo.regra.operador}</span>
                        {vinculo.regra.valor ? <span className="font-medium">&quot;{vinculo.regra.valor}&quot;</span> : null}
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => desvincular.mutate(vinculo.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive flex-shrink-0 transition-all duration-200"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info AND */}
      {(vinculadas || []).length > 1 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-foreground">
            As regras são aplicadas com lógica <strong>E (AND)</strong>. O lead será qualificado como MQL quando <strong>TODAS</strong> as regras forem atendidas.
          </p>
        </div>
      )}

      {/* Painel adicionar */}
      {showAdd && (
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground">Regras Disponíveis</h4>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar regras..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {regrasFiltradas.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {(disponiveis || []).length === 0
                  ? 'Nenhuma regra criada. Crie regras em Configurações > Regras.'
                  : 'Todas as regras já estão vinculadas'
                }
              </p>
            ) : (
              regrasFiltradas.map(regra => (
                <button
                  key={regra.id}
                  onClick={() => vincular.mutate(regra.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-accent text-left transition-all duration-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{regra.nome}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      {regra.campo_id && mapaCampos.has(regra.campo_id) && (
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          {mapaCampos.get(regra.campo_id)!.entidadeLabel} › {mapaCampos.get(regra.campo_id)!.nome}
                        </span>
                      )}
                      <span>{OPERADOR_LABEL[regra.operador] || regra.operador}</span>
                      {regra.valor ? <span className="font-medium">&quot;{regra.valor}&quot;</span> : null}
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
