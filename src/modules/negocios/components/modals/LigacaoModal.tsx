/**
 * AIDEV-NOTE: Modal de Ligação VoIP com integração real API4COM
 * Verifica conexão API4COM + ramal + créditos antes de permitir ligar
 * Click-to-call via Edge Function api4com-proxy
 * Painel de informações da oportunidade para consulta durante a chamada
 * Conforme Design System 10.5 - ModalBase
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone, PhoneOff, Clock, AlertCircle, PhoneCall, Loader2, Wallet,
  DollarSign, User, Calendar, Mail, Building2, Globe, Briefcase, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOportunidade } from '../../hooks/useOportunidadeDetalhes'
import { format } from 'date-fns'

type StatusLigacao = 'idle' | 'verificando' | 'pronto' | 'chamando' | 'conectada' | 'encerrada' | 'erro'

interface LigacaoModalProps {
  telefone: string
  contatoNome?: string
  onClose: () => void
  oportunidadeId?: string
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatData(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

// =====================================================
// Painel de Informações (coluna direita)
// =====================================================

function PainelInformacoes({ oportunidadeId }: { oportunidadeId: string }) {
  const { data: op, isLoading } = useOportunidade(oportunidadeId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!op) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">Dados não encontrados</p>
    )
  }

  const contato = op.contato as any
  const empresa = contato?.empresa || null
  const responsavel = op.responsavel

  return (
    <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1">
      {/* Seção Oportunidade */}
      <div>
        <h4 className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">
          Oportunidade
        </h4>
        <div className="space-y-2">
          <InfoRow icon={DollarSign} label="Valor" value={formatCurrency(op.valor)} iconColor="hsl(var(--success))" />
          {op.recorrente && (
            <InfoRow icon={RefreshCw} label="MRR" value={`${formatCurrency(op.valor)} / ${op.periodo_recorrencia || 'mensal'}`} />
          )}
          {responsavel && (
            <InfoRow
              icon={User}
              label="Responsável"
              value={`${responsavel.nome}${responsavel.sobrenome ? ` ${responsavel.sobrenome}` : ''}`}
            />
          )}
          <InfoRow icon={Calendar} label="Previsão" value={formatData(op.previsao_fechamento)} />
          {op.observacoes && (
            <div className="mt-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Observações</span>
              <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap line-clamp-3">{op.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Seção Contato */}
      {contato && (
        <div className="border-t border-border pt-3">
          <h4 className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">
            Contato
          </h4>
          <div className="space-y-2">
            {contato.tipo === 'pessoa' && (
              <InfoRow
                icon={User}
                label="Nome"
                value={[contato.nome, contato.sobrenome].filter(Boolean).join(' ') || '—'}
              />
            )}
            {contato.tipo === 'empresa' && (
              <InfoRow
                icon={Building2}
                label="Empresa"
                value={contato.nome_fantasia || contato.razao_social || '—'}
              />
            )}
            {contato.email && <InfoRow icon={Mail} label="Email" value={contato.email} />}
            {contato.telefone && <InfoRow icon={Phone} label="Telefone" value={contato.telefone} />}
            {contato.cargo && <InfoRow icon={Briefcase} label="Cargo" value={contato.cargo} />}
            {contato.linkedin_url && (
              <InfoRow icon={Globe} label="LinkedIn" value={contato.linkedin_url} isLink />
            )}
          </div>
        </div>
      )}

      {/* Seção Empresa vinculada */}
      {empresa && (
        <div className="border-t border-border pt-3">
          <h4 className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">
            Empresa
          </h4>
          <div className="space-y-2">
            {empresa.nome_fantasia && <InfoRow icon={Building2} label="Nome Fantasia" value={empresa.nome_fantasia} />}
            {empresa.razao_social && <InfoRow icon={Building2} label="Razão Social" value={empresa.razao_social} />}
            {empresa.cnpj && <InfoRow icon={Briefcase} label="CNPJ" value={empresa.cnpj} />}
            {empresa.email && <InfoRow icon={Mail} label="Email" value={empresa.email} />}
            {empresa.telefone && <InfoRow icon={Phone} label="Telefone" value={empresa.telefone} />}
            {empresa.website && <InfoRow icon={Globe} label="Website" value={empresa.website} isLink />}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, iconColor, isLink }: {
  icon: React.ElementType
  label: string
  value: string
  iconColor?: string
  isLink?: boolean
}) {
  if (!value || value === '—') {
    return (
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" style={iconColor ? { color: iconColor } : undefined} />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-20 flex-shrink-0">{label}</span>
        <span className="text-xs text-muted-foreground">—</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" style={iconColor ? { color: iconColor } : undefined} />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-20 flex-shrink-0 mt-0.5">{label}</span>
      {isLink ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-xs text-foreground truncate">{value}</span>
      )}
    </div>
  )
}

// =====================================================
// Componente Principal
// =====================================================

export function LigacaoModal({ telefone, contatoNome, onClose, oportunidadeId }: LigacaoModalProps) {
  const [status, setStatus] = useState<StatusLigacao>('verificando')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [, setApi4comConectado] = useState<boolean | null>(null)
  const [, setRamalConfigurado] = useState<boolean | null>(null)
  const [saldoInfo, setSaldoInfo] = useState<{ balance: number | null; has_credits: boolean | null } | null>(null)
  const [duracao, setDuracao] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasInfoPanel = !!oportunidadeId

  // AIDEV-NOTE: Chamada à Edge Function api4com-proxy
  const chamarProxy = useCallback(async (action: string, extras: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Sessão expirada')

    const res = await supabase.functions.invoke('api4com-proxy', {
      body: { action, ...extras },
    })

    if (res.error) {
      const msg = typeof res.error?.message === 'string' ? res.error.message : JSON.stringify(res.error)
      throw new Error(msg || 'Erro na Edge Function')
    }
    return res.data
  }, [])

  // Verificar pré-requisitos ao abrir o modal
  useEffect(() => {
    async function verificarPreRequisitos() {
      setStatus('verificando')
      try {
        const [statusRes, ramalRes, balanceRes] = await Promise.allSettled([
          chamarProxy('get-status'),
          chamarProxy('get-extension'),
          chamarProxy('get-balance'),
        ])

        const conexao = statusRes.status === 'fulfilled' ? statusRes.value?.conexao : null
        const conectado = conexao?.status === 'conectado'
        setApi4comConectado(conectado)

        const ramal = ramalRes.status === 'fulfilled' ? ramalRes.value?.ramal : null
        const temRamal = !!ramal?.extension
        setRamalConfigurado(temRamal)

        if (balanceRes.status === 'fulfilled' && balanceRes.value?.success) {
          setSaldoInfo({
            balance: balanceRes.value.balance,
            has_credits: balanceRes.value.has_credits,
          })
        }

        if (!conectado) {
          setStatus('erro')
          setMensagemErro('Telefonia não configurada. Configure a conexão API4COM em Configurações → Conexões.')
        } else if (!temRamal) {
          setStatus('erro')
          setMensagemErro('Ramal não configurado. Configure seu ramal VoIP em Configurações → Conexões → API4COM.')
        } else if (balanceRes.status === 'fulfilled' && balanceRes.value?.has_credits === false) {
          setStatus('erro')
          setMensagemErro('Créditos insuficientes na API4COM. Recarregue seu saldo para realizar ligações.')
        } else {
          setStatus('pronto')
        }
      } catch (err) {
        console.error('[LigacaoModal] Erro ao verificar pré-requisitos:', err)
        setStatus('erro')
        setMensagemErro('Erro ao verificar configuração de telefonia.')
        setApi4comConectado(false)
      }
    }
    verificarPreRequisitos()
  }, [chamarProxy])

  // Timer de duração
  useEffect(() => {
    if (status === 'conectada') {
      setDuracao(0)
      timerRef.current = setInterval(() => setDuracao(d => d + 1), 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  const formatDuracao = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  const handleLigar = async () => {
    if (status !== 'pronto') return
    setStatus('chamando')
    setMensagemErro(null)

    try {
      const result = await chamarProxy('make-call', { numero_destino: telefone })

      if (result.success) {
        setStatus('conectada')
      } else {
        setStatus('erro')
        const msg = typeof result?.message === 'string' ? result.message : 'Erro ao iniciar a chamada.'
        setMensagemErro(msg)
      }
    } catch (err) {
      console.error('[LigacaoModal] Erro ao fazer chamada:', err)
      setStatus('erro')
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao conectar com o servidor de telefonia.')
    }
  }

  const handleDesligar = () => {
    setStatus('encerrada')
    // AIDEV-TODO: Implementar endpoint de encerramento de chamada quando disponível na API4COM
  }

  const podeLigar = status === 'pronto'
  const emChamada = status === 'chamando' || status === 'conectada'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={!emChamada ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div className={`pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-32px)] animate-enter ${
          hasInfoPanel ? 'sm:max-w-2xl' : 'sm:max-w-sm'
        }`}>
          <div className={`${hasInfoPanel ? 'grid grid-cols-1 md:grid-cols-2' : ''}`}>
            {/* Coluna esquerda: Controles de ligação */}
            <div className={hasInfoPanel ? 'md:border-r md:border-border' : ''}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-border text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  emChamada ? 'bg-[hsl(var(--success))]/10' : 'bg-primary/10'
                }`}>
                  {status === 'verificando' ? (
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  ) : emChamada ? (
                    <PhoneCall className="w-6 h-6 text-[hsl(var(--success))] animate-pulse" />
                  ) : (
                    <Phone className="w-6 h-6 text-primary" />
                  )}
                </div>
                {contatoNome && (
                  <p className="text-sm font-semibold text-foreground">{contatoNome}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{telefone}</p>

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {status === 'verificando' && (
                    <>
                      <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                      <span className="text-xs text-muted-foreground">Verificando configuração...</span>
                    </>
                  )}
                  {status === 'chamando' && (
                    <>
                      <Clock className="w-3 h-3 text-primary animate-pulse" />
                      <span className="text-xs text-primary font-medium">Iniciando chamada...</span>
                    </>
                  )}
                  {status === 'conectada' && (
                    <>
                      <PhoneCall className="w-3 h-3 text-[hsl(var(--success))]" />
                      <span className="text-xs text-[hsl(var(--success))] font-medium">
                        Em chamada — {formatDuracao(duracao)}
                      </span>
                    </>
                  )}
                  {status === 'encerrada' && (
                    <>
                      <PhoneOff className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">
                        Chamada encerrada — {formatDuracao(duracao)}
                      </span>
                    </>
                  )}
                  {status === 'pronto' && (
                    <span className="text-xs text-[hsl(var(--success))] font-medium">✓ Pronto para ligar</span>
                  )}
                </div>
              </div>

              {/* Controles */}
              <div className="px-6 py-4 space-y-4">
                {status === 'erro' && mensagemErro && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-destructive">Não é possível ligar</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{mensagemErro}</p>
                    </div>
                  </div>
                )}

                {saldoInfo?.balance !== null && saldoInfo?.balance !== undefined && status !== 'erro' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      Saldo: <span className="font-medium text-foreground">R$ {Number(saldoInfo.balance).toFixed(2)}</span>
                    </span>
                  </div>
                )}

                {status === 'verificando' && (
                  <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Verificando conexão API4COM...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Verificando ramal VoIP...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Verificando créditos...</span>
                    </div>
                  </div>
                )}

                {status === 'pronto' && (
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[hsl(var(--success))]">✓</span>
                      <span className="text-[11px] text-muted-foreground">API4COM conectada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[hsl(var(--success))]">✓</span>
                      <span className="text-[11px] text-muted-foreground">Ramal configurado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[hsl(var(--success))]">
                        {saldoInfo?.has_credits === null ? '—' : '✓'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {saldoInfo?.has_credits === null ? 'Saldo não disponível (a chamada será tentada)' : 'Créditos disponíveis'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex items-center justify-center gap-4">
                  {emChamada ? (
                    <button
                      onClick={handleDesligar}
                      className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      title="Desligar"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>
                  ) : status === 'encerrada' ? (
                    <button
                      onClick={() => { setStatus('pronto'); setDuracao(0) }}
                      className="w-14 h-14 rounded-full bg-[hsl(var(--success))] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                      title="Ligar novamente"
                    >
                      <Phone className="w-6 h-6" />
                    </button>
                  ) : (
                    <button
                      onClick={handleLigar}
                      disabled={!podeLigar}
                      className="w-14 h-14 rounded-full bg-[hsl(var(--success))] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      title={podeLigar ? 'Ligar' : 'Verificando configuração...'}
                    >
                      {status === 'verificando' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Phone className="w-6 h-6" />
                      )}
                    </button>
                  )}
                </div>

                {(status === 'pronto' || status === 'chamando') && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Ao clicar em Ligar, seu ramal tocará primeiro. Ao atender, a chamada será conectada ao destino.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-border">
                <button
                  onClick={onClose}
                  disabled={status === 'chamando'}
                  className="w-full text-xs font-medium py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {emChamada ? 'Encerre a chamada antes de fechar' : 'Fechar'}
                </button>
              </div>
            </div>

            {/* Coluna direita: Informações da oportunidade */}
            {hasInfoPanel && (
              <div className="px-5 py-4 border-t border-border md:border-t-0">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Informações
                </h3>
                <PainelInformacoes oportunidadeId={oportunidadeId!} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
