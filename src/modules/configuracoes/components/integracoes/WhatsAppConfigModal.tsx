/**
 * AIDEV-NOTE: Modal de configuração avançada do WhatsApp
 * Move WhatsAppPipelineConfig para dentro de um modal
 * Inclui seção de Automação de Etiquetas (PRD plan etiqueta->etapa)
 * Conforme Design System 10.5 - ModalBase
 */

import { useState, useEffect } from 'react'
import { Phone, User, Tag, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModalBase } from '../ui/ModalBase'
import { WhatsAppPipelineConfig } from './WhatsAppPipelineConfig'
import { ContatosBloqueadosSection } from './ContatosBloqueadosSection'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import type { Integracao } from '../../services/configuracoes.api'

interface Props {
  integracao: Integracao
  onClose: () => void
}

type ComportamentoFechada = 'criar_nova' | 'ignorar' | 'criar_se_fechada'

const COMPORTAMENTO_OPTIONS: { value: ComportamentoFechada; label: string; desc: string }[] = [
  { value: 'criar_nova', label: 'Sempre criar novo negócio', desc: 'Cria um novo negócio mesmo que já exista um encerrado para esse contato' },
  { value: 'ignorar', label: 'Não fazer nada', desc: 'Se já existir qualquer negócio (aberto ou encerrado), não cria outro' },
  { value: 'criar_se_fechada', label: 'Criar apenas se não houver aberto', desc: 'Cria um novo negócio somente se não houver nenhum em andamento' },
]

export function WhatsAppConfigModal({ integracao, onClose }: Props) {
  const [etiquetaAtivo, setEtiquetaAtivo] = useState(false)
  const [comportamento, setComportamento] = useState<ComportamentoFechada>('criar_nova')
  const [loadingEtiqueta, setLoadingEtiqueta] = useState(true)
  const [savingEtiqueta, setSavingEtiqueta] = useState(false)

  // Carregar config de etiquetas
  useEffect(() => {
    if (!integracao.waha_session_id) {
      setLoadingEtiqueta(false)
      return
    }
    supabase
      .from('sessoes_whatsapp')
      .select('etiqueta_move_oportunidade, etiqueta_comportamento_fechada')
      .eq('id', integracao.waha_session_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEtiquetaAtivo(data.etiqueta_move_oportunidade ?? false)
          setComportamento((data.etiqueta_comportamento_fechada as ComportamentoFechada) ?? 'criar_nova')
        }
        setLoadingEtiqueta(false)
      })
  }, [integracao.waha_session_id])

  const handleSaveEtiqueta = async (ativo: boolean, comp?: ComportamentoFechada) => {
    if (!integracao.waha_session_id) return
    setSavingEtiqueta(true)
    try {
      const { error } = await supabase
        .from('sessoes_whatsapp')
        .update({
          etiqueta_move_oportunidade: ativo,
          etiqueta_comportamento_fechada: comp ?? comportamento,
        } as any)
        .eq('id', integracao.waha_session_id)
      if (error) throw error
      setEtiquetaAtivo(ativo)
      if (comp) setComportamento(comp)
      toast.success(ativo ? 'Automação de etiquetas ativada' : 'Automação de etiquetas desativada')
    } catch {
      toast.error('Erro ao salvar configuração')
    } finally {
      setSavingEtiqueta(false)
    }
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Configurações WhatsApp"
      description="Gerencie sessão e automações"
      variant="edit"
      size="md"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-medium px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Info da sessão */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Dados da Sessão</h4>
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            {integracao.waha_phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{integracao.waha_phone}</span>
              </div>
            )}
            {integracao.waha_session_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{integracao.waha_session_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Config */}
        {integracao.waha_session_id && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">Automação de Pipeline</h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <WhatsAppPipelineConfig sessaoId={integracao.waha_session_id} />
            </div>
          </div>
        )}

        {/* AIDEV-NOTE: Seção Automação de Etiquetas */}
        {integracao.waha_session_id && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Automação de Etiquetas
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-3">
              {loadingEtiqueta ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Carregando...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-foreground cursor-pointer">
                        Movimentar oportunidades por etiqueta
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Ao alterar uma etiqueta no WhatsApp, move ou cria oportunidade na etapa correspondente
                      </p>
                    </div>
                    <Switch
                      checked={etiquetaAtivo}
                      onCheckedChange={(checked) => handleSaveEtiqueta(checked)}
                      disabled={savingEtiqueta}
                    />
                  </div>

                  {etiquetaAtivo && (
                    <div className="pt-1">
                      <label className="text-xs font-medium text-foreground block mb-1.5">
                        Se o contato já teve um negócio encerrado
                      </label>
                      <div className="relative">
                        <select
                          value={comportamento}
                          onChange={(e) => handleSaveEtiqueta(true, e.target.value as ComportamentoFechada)}
                          disabled={savingEtiqueta}
                          className="w-full h-8 pl-3 pr-8 text-xs rounded-md border border-input bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
                        >
                          {COMPORTAMENTO_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {COMPORTAMENTO_OPTIONS.find(o => o.value === comportamento)?.desc}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2 border-t border-border pt-2">
                        Configure o nome da etiqueta em cada etapa na página de configuração da pipeline (Negócios → Configurar → Etapas)
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Contatos Bloqueados */}
        <ContatosBloqueadosSection />
      </div>
    </ModalBase>
  )
}
