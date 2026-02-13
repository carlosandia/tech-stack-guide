/**
 * AIDEV-NOTE: Drawer lateral com informações do contato (PRD-09 RF-004)
 * Seções: Contato, Ações rápidas, Notas, Mensagens Prontas, Oportunidades, Info da Conversa
 * Usa Supabase direto via conversas.api.ts
 */

import { useState } from 'react'
import { X, Phone, Mail, ChevronDown, ChevronRight, Loader2, MessageSquare, Zap, ListTodo, TrendingUp, Trash2, ExternalLink, Check, Clock, AlertTriangle } from 'lucide-react'
import { InstagramIcon } from '@/shared/components/InstagramIcon'
import { CriarTarefaConversaModal } from './CriarTarefaConversaModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversasApi, type Conversa, type NotaContato, type MensagemPronta } from '../services/conversas.api'
import { useMensagensProntas } from '../hooks/useMensagensProntas'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { supabase } from '@/lib/supabase'
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface ContatoDrawerProps {
  conversa: Conversa
  isOpen: boolean
  onClose: () => void
  onInsertQuickReply?: (conteudo: string) => void
  onCriarOportunidade?: () => void
}

function getInitials(nome?: string | null): string {
  if (!nome) return '?'
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

function SectionCollapsible({ title, icon, children, defaultOpen = false }: { title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default' }: {
  icon: React.ElementType
  label: string
  onClick?: () => void
  variant?: 'default' | 'destructive'
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 ${
        variant === 'destructive'
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

// Seção de histórico de tarefas (pendentes + concluídas)
function TarefasHistorico({ contatoId }: { contatoId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tarefas-historico', contatoId],
    queryFn: async () => {
      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select('id, titulo, tipo, prioridade, status, data_vencimento, data_conclusao, criado_em')
        .eq('contato_id', contatoId)
        .is('deletado_em', null)
        .order('criado_em', { ascending: false })
        .limit(30)
      if (error) throw error
      return tarefas || []
    },
    enabled: !!contatoId,
  })

  const tarefas = data || []
  const pendentes = tarefas.filter((t: any) => t.status !== 'concluida')
  const concluidas = tarefas.filter((t: any) => t.status === 'concluida')

  const prioridadeCor: Record<string, string> = {
    urgente: 'text-destructive',
    alta: 'text-warning-foreground',
    media: 'text-foreground',
    baixa: 'text-muted-foreground',
  }

  return (
    <SectionCollapsible title="Tarefas" icon={<ListTodo className="w-3.5 h-3.5 text-primary" />} defaultOpen>
      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : tarefas.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma tarefa registrada</p>
      ) : (
        <div className="space-y-1">
          {/* Pendentes */}
          {pendentes.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Pendentes ({pendentes.length})</p>
              {pendentes.map((t: any) => {
                const vencida = t.data_vencimento && isPast(new Date(t.data_vencimento))
                return (
                  <div key={t.id} className="p-2 rounded-md border border-border/30 hover:bg-accent/30 transition-colors">
                    <p className={`text-xs font-medium truncate ${prioridadeCor[t.prioridade] || 'text-foreground'}`}>
                      {t.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground capitalize">{t.tipo}</span>
                      {t.data_vencimento && (
                        <span className={`flex items-center gap-0.5 text-[10px] ${vencida ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {vencida ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          {format(new Date(t.data_vencimento), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Concluídas */}
          {concluidas.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-muted-foreground uppercase mt-2">Concluídas ({concluidas.length})</p>
              {concluidas.map((t: any) => (
                <div key={t.id} className="p-2 rounded-md border border-border/20 opacity-70">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-success flex-shrink-0" />
                    <p className="text-xs text-muted-foreground line-through truncate">{t.titulo}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ml-[18px]">
                    <span className="text-[10px] text-muted-foreground capitalize">{t.tipo}</span>
                    {t.data_conclusao && (
                      <span className="text-[10px] text-muted-foreground">
                        Concluída em {format(new Date(t.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </SectionCollapsible>
  )
}

// Seção de oportunidades vinculadas ao contato
function OportunidadesContato({ contatoId, navigate }: { contatoId: string; navigate: ReturnType<typeof useNavigate> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['oportunidades-contato', contatoId],
    queryFn: async () => {
      const { data: ops, error } = await supabase
        .from('oportunidades')
        .select(`
          id, titulo, valor, status,
          etapa:etapas_funil(nome, cor, funil:funis(id, nome))
        `)
        .eq('contato_id', contatoId)
        .is('deletado_em', null)
        .order('criado_em', { ascending: false })
        .limit(10)
      if (error) throw error
      return ops || []
    },
    enabled: !!contatoId,
  })

  const oportunidades = data || []

  const statusCor: Record<string, string> = {
    aberta: 'bg-success/15 text-success-foreground',
    ganha: 'bg-success/15 text-success-foreground',
    perdida: 'bg-destructive/15 text-destructive',
  }

  return (
    <SectionCollapsible title="Oportunidades" icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />} defaultOpen>
      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : oportunidades.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma oportunidade encontrada</p>
      ) : (
        <div className="space-y-1.5">
          {oportunidades.map((op: any) => {
            const etapa = op.etapa
            const funilNome = etapa?.funil?.nome || ''
            const funilId = etapa?.funil?.id || ''
            return (
              <button
                key={op.id}
                onClick={() => navigate(`/app/negocios?funil=${funilId}&oportunidade=${op.id}`)}
                className="w-full p-2.5 rounded-md text-left hover:bg-accent/50 transition-all duration-200 border border-border/30 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground truncate">{op.titulo}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {funilNome && (
                    <span className="text-[10px] text-muted-foreground truncate">{funilNome}</span>
                  )}
                  {etapa?.nome && (
                    <>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground truncate">{etapa.nome}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {op.valor != null && (
                    <span className="text-[10px] font-medium text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.valor)}
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${statusCor[op.status] || 'bg-muted text-muted-foreground'}`}>
                    {op.status}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </SectionCollapsible>
  )
}

// Seção de Histórico de Interações (métricas de mensagens)
function HistoricoInteracoes({ conversaId, totalMensagens }: { conversaId: string; totalMensagens: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['historico-interacoes', conversaId],
    queryFn: async () => {
      const { data: mensagens, error } = await supabase
        .from('mensagens')
        .select('from_me, criado_em')
        .eq('conversa_id', conversaId)
        .is('deletado_em', null)
        .order('criado_em', { ascending: true })

      if (error) throw error
      if (!mensagens || mensagens.length === 0) return { enviadas: 0, recebidas: 0, tempoMedioMin: null }

      let enviadas = 0
      let recebidas = 0
      let tempoRespostaTotal = 0
      let tempoRespostaCount = 0

      for (let i = 0; i < mensagens.length; i++) {
        if (mensagens[i].from_me) {
          enviadas++
        } else {
          recebidas++
          // Calcular tempo de resposta: próxima mensagem enviada após recebida
          for (let j = i + 1; j < mensagens.length; j++) {
            if (mensagens[j].from_me) {
              const diff = new Date(mensagens[j].criado_em).getTime() - new Date(mensagens[i].criado_em).getTime()
              tempoRespostaTotal += diff
              tempoRespostaCount++
              break
            }
          }
        }
      }

      const tempoMedioMin = tempoRespostaCount > 0
        ? Math.round(tempoRespostaTotal / tempoRespostaCount / 60000)
        : null

      return { enviadas, recebidas, tempoMedioMin }
    },
    enabled: !!conversaId,
  })

  const formatTempoResposta = (min: number | null) => {
    if (min === null) return '—'
    if (min < 1) return '< 1 min'
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  return (
    <SectionCollapsible title="Histórico de Interações" icon={<MessageSquare className="w-3.5 h-3.5 text-primary" />} defaultOpen>
      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-md bg-muted/50 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Total</p>
            <p className="text-lg font-semibold text-foreground">{totalMensagens}</p>
          </div>
          <div className="p-2.5 rounded-md bg-muted/50 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Tempo médio</p>
            <p className="text-lg font-semibold text-foreground">{formatTempoResposta(data?.tempoMedioMin ?? null)}</p>
          </div>
          <div className="p-2.5 rounded-md bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Enviadas</p>
            <p className="text-lg font-semibold text-foreground">{data?.enviadas ?? 0}</p>
          </div>
          <div className="p-2.5 rounded-md bg-muted/50 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Recebidas</p>
            <p className="text-lg font-semibold text-foreground">{data?.recebidas ?? 0}</p>
          </div>
        </div>
      )}
    </SectionCollapsible>
  )
}

export function ContatoDrawer({ conversa, isOpen, onClose, onInsertQuickReply, onCriarOportunidade }: ContatoDrawerProps) {
  const [novaNota, setNovaNota] = useState('')
  const [tarefaModalOpen, setTarefaModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const contato = conversa.contato
  const nome = contato?.nome || contato?.nome_fantasia || conversa.nome || 'Sem nome'

  // Notas do contato
  const { data: notasData, isLoading: notasLoading } = useQuery({
    queryKey: ['notas-contato', conversa.contato_id],
    queryFn: () => conversasApi.listarNotas(conversa.contato_id),
    enabled: isOpen && !!conversa.contato_id,
  })

  const criarNota = useMutation({
    mutationFn: (conteudo: string) => conversasApi.criarNota(conversa.contato_id, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas-contato', conversa.contato_id] })
      setNovaNota('')
      toast.success('Nota salva')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar nota')
    },
  })

  // Mensagens prontas
  const { data: prontasData, isLoading: prontasLoading } = useMensagensProntas()

  if (!isOpen) return null

  const prontas = prontasData?.mensagens_prontas || []
  const pessoais = prontas.filter((m: MensagemPronta) => m.tipo === 'pessoal')
  const globais = prontas.filter((m: MensagemPronta) => m.tipo === 'global')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] bg-black/30 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer - mobile fullscreen (GAP 5) */}
      <div className={`
        fixed right-0 top-0 bottom-0 z-[301] w-full sm:w-[320px] bg-white border-l border-border
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:z-auto lg:transform-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Info do Contato</span>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-md transition-all duration-200">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content - safe area inset para iOS (GAP 5) */}
        <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center py-6 px-4 border-b border-border/50">
            {contato?.foto_url ? (
              <img src={contato.foto_url} alt={nome} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{getInitials(nome)}</span>
              </div>
            )}
            <h3 className="mt-3 text-base font-semibold text-foreground text-center">{nome}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              {conversa.canal === 'whatsapp' ? (
                <WhatsAppIcon size={14} className="text-[#25D366]" />
              ) : (
                <InstagramIcon size={14} className="text-[#E4405F]" />
              )}
              <span className="text-xs text-muted-foreground capitalize">{conversa.canal}</span>
            </div>
          </div>

          {/* Ações Rápidas (PRD-09 RF-004) */}
          <div className="flex items-center justify-center gap-2 py-3 px-4 border-b border-border/50">
            <ActionButton
              icon={MessageSquare}
              label="Mensagem"
              onClick={() => {
                onClose()
                toast.info('Foque no campo de mensagem para responder')
              }}
            />
            <ActionButton
              icon={ListTodo}
              label="Tarefa"
              onClick={() => setTarefaModalOpen(true)}
            />
            <ActionButton
              icon={TrendingUp}
              label="Oportunidade"
              onClick={onCriarOportunidade}
            />
            <ActionButton
              icon={Trash2}
              label="Excluir"
              variant="destructive"
              onClick={() => toast.info('Exclusão de conversa será implementada em breve')}
            />
          </div>

          {/* Contact Info */}
          <div className="px-4 py-3 space-y-2 border-b border-border/50">
            {contato?.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{contato.telefone}</span>
              </div>
            )}
            {contato?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground truncate">{contato.email}</span>
              </div>
            )}
            {!contato?.telefone && !contato?.email && (
              <p className="text-xs text-muted-foreground">Nenhuma informação de contato</p>
            )}
          </div>

          {/* Notas do Contato */}
          <SectionCollapsible title="Notas do Contato" defaultOpen>
            {notasLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {(notasData?.notas || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma nota adicionada</p>
                )}
                {(notasData?.notas || []).map((nota: NotaContato) => (
                  <div key={nota.id} className="p-2 rounded-md bg-warning-muted/20 border border-warning/20">
                    <p className="text-xs text-foreground whitespace-pre-wrap">{nota.conteudo}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(nota.criado_em), 'dd/MM/yyyy HH:mm')}
                      </p>
                      {nota.usuario?.nome && (
                        <p className="text-[10px] text-muted-foreground">
                          por {nota.usuario.nome}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add note */}
                <div className="space-y-1.5 mt-2">
                  <textarea
                    value={novaNota}
                    onChange={(e) => setNovaNota(e.target.value)}
                    placeholder="Adicionar nota..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={() => novaNota.trim() && criarNota.mutate(novaNota.trim())}
                    disabled={!novaNota.trim() || criarNota.isPending}
                    className="w-full py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                  >
                    {criarNota.isPending ? 'Salvando...' : '+ Adicionar nota'}
                  </button>
                </div>
              </div>
            )}
          </SectionCollapsible>

          {/* Mensagens Prontas */}
          <SectionCollapsible title="Mensagens Prontas" icon={<Zap className="w-3.5 h-3.5 text-primary" />}>
            {prontasLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {prontas.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma mensagem pronta</p>
                )}

                {pessoais.length > 0 && (
                  <>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase mt-1">Minhas</p>
                    {pessoais.map((mp: MensagemPronta) => (
                      <button
                        key={mp.id}
                        onClick={() => onInsertQuickReply?.(mp.conteudo)}
                        className="w-full p-2 rounded-md text-left hover:bg-accent/50 transition-all duration-200 border border-border/30"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-primary">/{mp.atalho}</span>
                          <span className="text-[11px] text-muted-foreground">— {mp.titulo}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {globais.length > 0 && (
                  <>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase mt-2">Equipe</p>
                    {globais.map((mp: MensagemPronta) => (
                      <button
                        key={mp.id}
                        onClick={() => onInsertQuickReply?.(mp.conteudo)}
                        className="w-full p-2 rounded-md text-left hover:bg-accent/50 transition-all duration-200 border border-border/30"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-primary">/{mp.atalho}</span>
                          <span className="text-[11px] text-muted-foreground">— {mp.titulo}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </SectionCollapsible>

          {/* Tarefas do Contato (histórico completo) */}
          <TarefasHistorico contatoId={conversa.contato_id} />

          {/* Oportunidades do Contato */}
          <OportunidadesContato contatoId={conversa.contato_id} navigate={navigate} />

          {/* Histórico de Interações */}
          <HistoricoInteracoes conversaId={conversa.id} totalMensagens={conversa.total_mensagens} />

          {/* Conversation Info */}
          <SectionCollapsible title="Informações da Conversa">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal</span>
                <span className="text-foreground capitalize">{conversa.canal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span className="text-foreground capitalize">{conversa.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground capitalize">{conversa.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de mensagens</span>
                <span className="text-foreground">{conversa.total_mensagens}</span>
              </div>
              {conversa.primeira_mensagem_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeira mensagem</span>
                  <span className="text-foreground">{format(new Date(conversa.primeira_mensagem_em), 'dd/MM/yyyy')}</span>
                </div>
              )}
              {conversa.ultima_mensagem_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última mensagem</span>
                  <span className="text-foreground">{format(new Date(conversa.ultima_mensagem_em), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </SectionCollapsible>
        </div>

        {/* Modal de Criar Tarefa */}
        {tarefaModalOpen && (
          <CriarTarefaConversaModal
            contatoId={conversa.contato_id}
            contatoNome={nome}
            canal={conversa.canal}
            onClose={() => setTarefaModalOpen(false)}
          />
        )}
      </div>
    </>
  )
}
