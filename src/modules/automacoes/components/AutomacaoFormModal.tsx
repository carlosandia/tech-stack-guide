/**
 * AIDEV-NOTE: Modal de criação/edição de automação (PRD-12)
 * Interface em 3 passos: Trigger → Condição → Ação
 * Conforme Design System - Modal/Dialog
 */

import { useState, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Zap, Filter, Play, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  TRIGGER_TIPOS,
  TRIGGER_CATEGORIAS,
  ACAO_TIPOS,
  VARIAVEIS_DINAMICAS,
  type Automacao,
  type Acao,
  type Condicao,
} from '../schemas/automacoes.schema'
import { useCriarAutomacao, useAtualizarAutomacao } from '../hooks/useAutomacoes'

interface AutomacaoFormModalProps {
  automacao?: Automacao | null
  onClose: () => void
}

type Step = 'info' | 'trigger' | 'condicoes' | 'acoes'

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'info', label: 'Informações', icon: Zap },
  { key: 'trigger', label: 'Gatilho', icon: Play },
  { key: 'condicoes', label: 'Condições', icon: Filter },
  { key: 'acoes', label: 'Ações', icon: ChevronRight },
]

export function AutomacaoFormModal({ automacao, onClose }: AutomacaoFormModalProps) {
  const isEditing = !!automacao

  const [step, setStep] = useState<Step>('info')
  const [nome, setNome] = useState(automacao?.nome || '')
  const [descricao, setDescricao] = useState(automacao?.descricao || '')
  const [triggerTipo, setTriggerTipo] = useState(automacao?.trigger_tipo || '')
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(automacao?.trigger_config || {})
  const [condicoes, setCondicoes] = useState<Condicao[]>(automacao?.condicoes || [])
  const [acoes, setAcoes] = useState<Acao[]>(automacao?.acoes || [])
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('')

  const criarMutation = useCriarAutomacao()
  const atualizarMutation = useAtualizarAutomacao()
  const isSaving = criarMutation.isPending || atualizarMutation.isPending

  const stepIndex = STEPS.findIndex(s => s.key === step)

  const canNext = useCallback(() => {
    if (step === 'info') return nome.trim().length > 0
    if (step === 'trigger') return triggerTipo.length > 0
    if (step === 'condicoes') return true // Condições são opcionais
    return true
  }, [step, nome, triggerTipo])

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1].key)
    }
  }

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1].key)
    }
  }

  const handleSave = async () => {
    if (acoes.length === 0) {
      toast.error('Adicione pelo menos uma ação')
      return
    }

    try {
      if (isEditing) {
        await atualizarMutation.mutateAsync({
          id: automacao.id,
          payload: { nome, descricao: descricao || null, trigger_tipo: triggerTipo, trigger_config: triggerConfig, condicoes, acoes },
        })
      } else {
        await criarMutation.mutateAsync({
          nome, descricao: descricao || undefined, trigger_tipo: triggerTipo, trigger_config: triggerConfig, condicoes, acoes,
        })
      }
      onClose()
    } catch { /* tratado pelo hook */ }
  }

  const addCondicao = () => {
    setCondicoes(prev => [...prev, { campo: '', operador: 'igual', valor: '' }])
  }

  const removeCondicao = (idx: number) => {
    setCondicoes(prev => prev.filter((_, i) => i !== idx))
  }

  const updateCondicao = (idx: number, field: keyof Condicao, value: unknown) => {
    setCondicoes(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const addAcao = (tipo: string) => {
    setAcoes(prev => [...prev, { tipo, config: {} }])
  }

  const removeAcao = (idx: number) => {
    setAcoes(prev => prev.filter((_, i) => i !== idx))
  }

  const updateAcaoConfig = (idx: number, key: string, value: unknown) => {
    setAcoes(prev => prev.map((a, i) => i === idx ? { ...a, config: { ...a.config, [key]: value } } : a))
  }

  const triggersCategoria = categoriaFiltro
    ? TRIGGER_TIPOS.filter(t => t.categoria === categoriaFiltro)
    : TRIGGER_TIPOS

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-popover rounded-lg shadow-xl border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isEditing ? 'Editar Automação' : 'Nova Automação'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {STEPS[stepIndex].label} ({stepIndex + 1}/{STEPS.length})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-border/50 bg-muted/30">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === stepIndex
            const isDone = i < stepIndex
            return (
              <button
                key={s.key}
                onClick={() => { if (isDone || isActive) setStep(s.key) }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isDone ? 'bg-primary/10 text-primary cursor-pointer' :
                  'text-muted-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Step: Info */}
          {step === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome da automação *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Notificar vendedor ao criar oportunidade"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descrição (opcional)</label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Descreva o objetivo desta automação..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Step: Trigger */}
          {step === 'trigger' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Quando este evento acontecer, a automação será disparada:</p>

              {/* Filtro por categoria */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoriaFiltro('')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    !categoriaFiltro ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Todos
                </button>
                {TRIGGER_CATEGORIAS.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoriaFiltro(cat.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      categoriaFiltro === cat.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Lista de triggers */}
              <div className="space-y-1">
                {triggersCategoria.map(trigger => (
                  <button
                    key={trigger.tipo}
                    onClick={() => setTriggerTipo(trigger.tipo)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-colors ${
                      triggerTipo === trigger.tipo
                        ? 'bg-primary/10 text-primary border border-primary/30 font-medium'
                        : 'text-foreground hover:bg-accent border border-transparent'
                    }`}
                  >
                    <Zap className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <span>{trigger.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">
                        {TRIGGER_CATEGORIAS.find(c => c.key === trigger.categoria)?.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Config específica do trigger (etapa destino, funil, etc) */}
              {triggerTipo === 'oportunidade_etapa_movida' && (
                <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border/50 space-y-2">
                  <label className="block text-xs font-medium text-foreground">Configuração do gatilho</label>
                  <input
                    type="text"
                    placeholder="ID da etapa destino (opcional)"
                    value={(triggerConfig.etapa_destino_id as string) || ''}
                    onChange={e => setTriggerConfig(prev => ({ ...prev, etapa_destino_id: e.target.value || undefined }))}
                    className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground">Deixe vazio para disparar em qualquer movimentação</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Condições */}
          {step === 'condicoes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Filtre quando a automação deve executar (opcional):</p>
                <button
                  onClick={addCondicao}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Condição
                </button>
              </div>

              {condicoes.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma condição adicionada. A automação disparará sempre que o gatilho ocorrer.
                </div>
              )}

              {condicoes.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-md border border-border/50 bg-muted/30">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <select
                      value={cond.campo}
                      onChange={e => updateCondicao(idx, 'campo', e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-foreground"
                    >
                      <option value="">Campo...</option>
                      <option value="funil_id">Funil</option>
                      <option value="etapa_id">Etapa</option>
                      <option value="usuario_responsavel_id">Responsável</option>
                      <option value="valor">Valor</option>
                      <option value="origem">Origem do contato</option>
                      <option value="tipo_contato">Tipo de contato</option>
                    </select>
                    <select
                      value={cond.operador}
                      onChange={e => updateCondicao(idx, 'operador', e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-foreground"
                    >
                      <option value="igual">Igual a</option>
                      <option value="diferente">Diferente de</option>
                      <option value="contem">Contém</option>
                      <option value="maior">Maior que</option>
                      <option value="menor">Menor que</option>
                      <option value="vazio">Está vazio</option>
                      <option value="nao_vazio">Não está vazio</option>
                    </select>
                    {!['vazio', 'nao_vazio'].includes(cond.operador) && (
                      <input
                        type="text"
                        value={cond.valor as string || ''}
                        onChange={e => updateCondicao(idx, 'valor', e.target.value)}
                        placeholder="Valor..."
                        className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeCondicao(idx)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {condicoes.length > 1 && (
                <p className="text-xs text-muted-foreground text-center">
                  Todas as condições devem ser verdadeiras (lógica AND)
                </p>
              )}
            </div>
          )}

          {/* Step: Ações */}
          {step === 'acoes' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Defina o que acontece quando a automação dispara:</p>

              {/* Ações adicionadas */}
              {acoes.map((acao, idx) => {
                const acaoInfo = ACAO_TIPOS.find(a => a.tipo === acao.tipo)
                return (
                  <div key={idx} className="p-3 rounded-md border border-border/50 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">{acaoInfo?.label || acao.tipo}</span>
                      </div>
                      <button onClick={() => removeAcao(idx)} className="p-1 rounded text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Config específica da ação */}
                    {(acao.tipo === 'enviar_whatsapp' || acao.tipo === 'enviar_email') && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder={acao.tipo === 'enviar_email' ? 'Destinatário (email ou {{responsavel.email}})' : 'Número ou {{contato.telefone}}'}
                          value={(acao.config.destinatario as string) || ''}
                          onChange={e => updateAcaoConfig(idx, 'destinatario', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                        />
                        {acao.tipo === 'enviar_email' && (
                          <input
                            type="text"
                            placeholder="Assunto do email"
                            value={(acao.config.assunto as string) || ''}
                            onChange={e => updateAcaoConfig(idx, 'assunto', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                          />
                        )}
                        <textarea
                          placeholder="Mensagem (use variáveis como {{contato.nome}})"
                          value={(acao.config.mensagem as string) || ''}
                          onChange={e => updateAcaoConfig(idx, 'mensagem', e.target.value)}
                          rows={3}
                          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground resize-none"
                        />
                      </div>
                    )}

                    {acao.tipo === 'criar_notificacao' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Título da notificação"
                          value={(acao.config.titulo as string) || ''}
                          onChange={e => updateAcaoConfig(idx, 'titulo', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                        />
                        <input
                          type="text"
                          placeholder="Mensagem"
                          value={(acao.config.mensagem as string) || ''}
                          onChange={e => updateAcaoConfig(idx, 'mensagem', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    )}

                    {acao.tipo === 'criar_tarefa' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Título da tarefa"
                          value={(acao.config.titulo as string) || ''}
                          onChange={e => updateAcaoConfig(idx, 'titulo', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                        />
                        <select
                          value={(acao.config.tipo_tarefa as string) || 'geral'}
                          onChange={e => updateAcaoConfig(idx, 'tipo_tarefa', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground"
                        >
                          <option value="geral">Geral</option>
                          <option value="ligacao">Ligação</option>
                          <option value="email">Email</option>
                          <option value="reuniao">Reunião</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Prazo em horas (ex: 24)"
                          value={(acao.config.prazo_horas as number) || ''}
                          onChange={e => updateAcaoConfig(idx, 'prazo_horas', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    )}

                    {acao.tipo === 'alterar_responsavel' && (
                      <input
                        type="text"
                        placeholder="ID do novo responsável"
                        value={(acao.config.usuario_id as string) || ''}
                        onChange={e => updateAcaoConfig(idx, 'usuario_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                      />
                    )}

                    {acao.tipo === 'mover_etapa' && (
                      <input
                        type="text"
                        placeholder="ID da etapa destino"
                        value={(acao.config.etapa_id as string) || ''}
                        onChange={e => updateAcaoConfig(idx, 'etapa_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                      />
                    )}

                    {acao.tipo === 'aguardar' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Quantidade"
                          value={(acao.config.quantidade as number) || ''}
                          onChange={e => updateAcaoConfig(idx, 'quantidade', Number(e.target.value))}
                          className="w-24 px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                          min={1}
                        />
                        <select
                          value={(acao.config.unidade as string) || 'minutos'}
                          onChange={e => updateAcaoConfig(idx, 'unidade', e.target.value)}
                          className="px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground"
                        >
                          <option value="segundos">Segundos</option>
                          <option value="minutos">Minutos</option>
                          <option value="horas">Horas</option>
                          <option value="dias">Dias</option>
                        </select>
                      </div>
                    )}

                    {acao.tipo === 'adicionar_segmento' && (
                      <input
                        type="text"
                        placeholder="ID do segmento"
                        value={(acao.config.segmento_id as string) || ''}
                        onChange={e => updateAcaoConfig(idx, 'segmento_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                      />
                    )}
                  </div>
                )
              })}

              {/* Botões para adicionar ações */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Adicionar ação:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ACAO_TIPOS.map(acao => (
                    <button
                      key={acao.tipo}
                      onClick={() => addAcao(acao.tipo)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-foreground border border-border/50 hover:bg-accent hover:border-primary/30 transition-colors text-left"
                    >
                      <Plus className="w-3 h-3 text-muted-foreground" />
                      {acao.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variáveis dinâmicas */}
              <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                <p className="text-xs font-medium text-foreground mb-2">Variáveis disponíveis:</p>
                <div className="flex flex-wrap gap-1">
                  {VARIAVEIS_DINAMICAS.map(v => (
                    <button
                      key={v.chave}
                      onClick={() => navigator.clipboard.writeText(v.chave).then(() => toast.success(`${v.chave} copiado`))}
                      className="px-2 py-0.5 rounded text-xs bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
                      title={`${v.label} - Clique para copiar`}
                    >
                      {v.chave}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={stepIndex > 0 ? handlePrev : onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {stepIndex > 0 ? 'Voltar' : 'Cancelar'}
          </button>

          {stepIndex < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving || acoes.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Automação'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
