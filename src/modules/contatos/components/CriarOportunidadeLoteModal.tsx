/**
 * AIDEV-NOTE: Modal multi-step para criação de oportunidades em massa
 * Conforme plano aprovado - Criação de Oportunidades em Massa a partir de Contatos
 * Steps: Pipeline → Distribuição → Resumo/Confirmação
 */

import { useState, useEffect, useMemo } from 'react'
import { Target, Loader2, Check, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useFunis, useFunilComEtapas } from '@/modules/negocios/hooks/useFunis'
// AIDEV-NOTE: negociosApi removido - membros agora buscados diretamente da tabela usuarios
import { useCriarOportunidadesLote } from '../hooks/useContatos'

type DistribuicaoTipo = 'nenhuma' | 'rodizio' | 'manual'

interface Membro {
  id: string
  nome: string
  sobrenome?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  selectedIds: string[]
  onSuccess: () => void
}

export function CriarOportunidadeLoteModal({ open, onClose, selectedIds, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedFunilId, setSelectedFunilId] = useState<string | null>(null)
  const [distribuicao, setDistribuicao] = useState<DistribuicaoTipo>('nenhuma')
  const [selectedMembros, setSelectedMembros] = useState<Set<string>>(new Set())
  const [membros, setMembros] = useState<Membro[]>([])
  const [loadingMembros, setLoadingMembros] = useState(false)
  // AIDEV-NOTE: progresso reservado para futura barra de progresso em lotes grandes

  const { data: funis } = useFunis()
  const { data: funilComEtapas } = useFunilComEtapas(selectedFunilId)
  const criarLote = useCriarOportunidadesLote()

  const funisAtivos = useMemo(() => (funis || []).filter(f => !f.arquivado), [funis])
  const selectedFunil = funisAtivos.find(f => f.id === selectedFunilId)
  const etapaEntrada = funilComEtapas?.etapas?.find(e => (e as any).tipo === 'entrada') || funilComEtapas?.etapas?.[0]

  const totalContatos = selectedIds.length
  const excedeLimite = totalContatos > 100

  // Carregar todos os membros ativos do tenant (role member ou admin)
  useEffect(() => {
    if (!selectedFunilId) return
    setLoadingMembros(true)
    import('@/lib/supabase').then(({ supabase }) => {
      supabase
        .from('usuarios')
        .select('id, nome, sobrenome')
        .in('role', ['member', 'admin'])
        .eq('status', 'ativo')
        .is('deletado_em', null)
        .then(({ data: usuarios }) => {
          setMembros((usuarios || []) as Membro[])
          setLoadingMembros(false)
        })
    })
  }, [selectedFunilId])

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setStep(1)
      setSelectedFunilId(null)
      setDistribuicao('nenhuma')
      setSelectedMembros(new Set())
    }
  }, [open])

  // Calcular distribuição
  const membrosDistribuicao = distribuicao === 'manual'
    ? membros.filter(m => selectedMembros.has(m.id))
    : distribuicao === 'rodizio'
      ? membros
      : []

  const totalMembros = membrosDistribuicao.length
  const porMembro = totalMembros > 0 ? Math.floor(totalContatos / totalMembros) : 0
  const resto = totalMembros > 0 ? totalContatos % totalMembros : 0

  const handleToggleMembro = (id: string) => {
    setSelectedMembros(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirmar = () => {
    if (!selectedFunilId) return

    criarLote.mutate(
      {
        contato_ids: selectedIds,
        funil_id: selectedFunilId,
        distribuicao,
        membro_ids: distribuicao === 'manual' ? Array.from(selectedMembros) : undefined,
      },
      {
        onSuccess: () => {
          onSuccess()
          onClose()
        },
      }
    )
  }

  const canProceedStep1 = !!selectedFunilId && !excedeLimite
  const canProceedStep2 = distribuicao === 'nenhuma' || (distribuicao === 'rodizio' && membros.length > 0) || (distribuicao === 'manual' && selectedMembros.size > 0)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Criar Oportunidades em Massa
          </DialogTitle>
          <DialogDescription>
            {totalContatos} contato{totalContatos > 1 ? 's' : ''} selecionado{totalContatos > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step === s ? 'bg-primary text-primary-foreground' : step > s ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span className={`text-xs hidden sm:inline ${step === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Pipeline' : s === 2 ? 'Distribuição' : 'Confirmar'}
              </span>
              {s < 3 && <div className="w-6 h-px bg-border hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Alerta de limite */}
        {excedeLimite && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Máximo de 100 contatos por lote. Selecione menos contatos.
          </div>
        )}

        {/* Step 1: Pipeline */}
        {step === 1 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-sm text-muted-foreground">Em qual pipeline criar as oportunidades?</p>
            {funisAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pipeline ativa</p>
            ) : (
              funisAtivos.map(funil => (
                <button
                  key={funil.id}
                  onClick={() => setSelectedFunilId(funil.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition-colors text-left ${
                    selectedFunilId === funil.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: funil.cor || '#3B82F6' }} />
                  <span className="text-sm font-medium text-foreground">{funil.nome}</span>
                  {selectedFunilId === funil.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Distribuição */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Como distribuir entre a equipe?</p>

            {/* Opções de distribuição */}
            <div className="space-y-2">
              {([
                { value: 'nenhuma' as const, label: 'Não distribuir', desc: 'Oportunidades ficam sem responsável' },
                { value: 'rodizio' as const, label: 'Rodízio automático', desc: `Distribuir entre ${membros.length} membro${membros.length !== 1 ? 's' : ''} do funil` },
                { value: 'manual' as const, label: 'Escolher membros', desc: 'Selecionar quais membros participam' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDistribuicao(opt.value)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md border transition-colors text-left ${
                    distribuicao === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    distribuicao === opt.value ? 'border-primary' : 'border-input'
                  }`}>
                    {distribuicao === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Lista de membros para seleção manual */}
            {distribuicao === 'manual' && (
              <div className="border border-border rounded-md max-h-[180px] overflow-y-auto">
                {loadingMembros ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : membros.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro encontrado</p>
                ) : (
                  membros.map(m => {
                    const checked = selectedMembros.has(m.id)
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleToggleMembro(m.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked ? 'bg-primary border-primary' : 'border-input'
                        }`}>
                          {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-foreground">{[m.nome, m.sobrenome].filter(Boolean).join(' ')}</span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Resumo */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pipeline</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedFunil?.cor || '#3B82F6' }} />
                  {selectedFunil?.nome}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Etapa de entrada</span>
                <span className="font-medium text-foreground">{etapaEntrada?.nome || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Oportunidades</span>
                <span className="font-medium text-foreground">{totalContatos}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distribuição</span>
                <span className="font-medium text-foreground">
                  {distribuicao === 'nenhuma' && 'Sem responsável'}
                  {distribuicao === 'rodizio' && `Rodízio (${membros.length} membros)`}
                  {distribuicao === 'manual' && `Manual (${selectedMembros.size} membros)`}
                </span>
              </div>
            </div>

            {/* Preview de distribuição */}
            {totalMembros > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Distribuição prevista</p>
                <div className="space-y-1">
                  {membrosDistribuicao.map((m, i) => {
                    const qtd = porMembro + (i < resto ? 1 : 0)
                    return (
                      <div key={m.id} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/30 text-sm">
                        <span className="text-foreground">{[m.nome, m.sobrenome].filter(Boolean).join(' ')}</span>
                        <span className="text-muted-foreground font-medium">{qtd} oportunidade{qtd !== 1 ? 's' : ''}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Progresso */}
            {criarLote.isPending && (
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: '100%' }} />
                </div>
                <p className="text-xs text-muted-foreground text-center">Criando oportunidades...</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            onClick={() => {
              if (step === 1) onClose()
              else setStep((s) => (s - 1) as 1 | 2 | 3)
            }}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent transition-colors"
            disabled={criarLote.isPending}
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleConfirmar}
              disabled={criarLote.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {criarLote.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Criar {totalContatos} Oportunidade{totalContatos > 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
