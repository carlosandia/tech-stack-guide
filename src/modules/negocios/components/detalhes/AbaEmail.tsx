/**
 * AIDEV-NOTE: Aba E-mail (RF-14.3 Tab 4) - Implementação completa
 * Compor e-mail com editor rich text (RichTextEditor)
 * Integrado com conexão SMTP de /configuracoes/conexoes para envio real
 */

import { useState, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { Mail, Send, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, Clock, Save } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEmailsOportunidade, useCriarEmail, useConexaoEmail } from '../../hooks/useDetalhes'
import { RichTextEditor } from '@/modules/configuracoes/components/editor/RichTextEditor'
import type { EmailOportunidade } from '../../services/detalhes.api'

interface AbaEmailProps {
  oportunidadeId: string
  emailContato?: string | null
}

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle2; class: string }> = {
  enviado: { label: 'Enviado', icon: CheckCircle2, class: 'text-success' },
  rascunho: { label: 'Rascunho', icon: Clock, class: 'text-warning-foreground' },
  falhou: { label: 'Falhou', icon: AlertCircle, class: 'text-destructive' },
  pendente: { label: 'Pendente', icon: Clock, class: 'text-muted-foreground' },
}

export function AbaEmail({ oportunidadeId, emailContato }: AbaEmailProps) {
  const { data: emails, isLoading } = useEmailsOportunidade(oportunidadeId)
  const criarEmail = useCriarEmail()
  const { data: conexaoEmail } = useConexaoEmail()

  // AIDEV-NOTE: Buscar assinatura global de configuracoes_tenant
  const { data: configAssinatura } = useQuery({
    queryKey: ['config-tenant-assinatura'],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracoes_tenant')
        .select('assinatura_mensagem, assinatura_incluir_novos')
        .maybeSingle()
      return data
    },
    staleTime: 5 * 60 * 1000,
  })

  const buildSignatureHtml = useCallback(() => {
    if (configAssinatura?.assinatura_mensagem && configAssinatura.assinatura_incluir_novos !== false) {
      return `<br/><p style="margin: 16px 0 4px 0; color: #9ca3af;">--</p><div class="email-signature">${configAssinatura.assinatura_mensagem}</div>`
    }
    return ''
  }, [configAssinatura])

  const [showForm, setShowForm] = useState(false)
  const [destinatario, setDestinatario] = useState(emailContato || '')
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')

  // Injetar assinatura ao abrir o form
  const handleToggleForm = useCallback(() => {
    if (!showForm) {
      setCorpo(buildSignatureHtml())
    }
    setShowForm(!showForm)
  }, [showForm, buildSignatureHtml])

  const smtpConectado = conexaoEmail?.conectado === true
  const emailRemetente = conexaoEmail?.email

  const handleEnviar = useCallback(async (enviar: boolean) => {
    if (!destinatario.trim() || !assunto.trim()) {
      toast.error('Preencha destinatário e assunto')
      return
    }

    try {
      await criarEmail.mutateAsync({
        oportunidadeId,
        payload: {
          destinatario: destinatario.trim(),
          assunto: assunto.trim(),
          corpo: corpo.trim(),
        },
        enviar,
      })
      setDestinatario(emailContato || '')
      setAssunto('')
      setCorpo('')
      setShowForm(false)
      toast.success(enviar ? 'E-mail enviado com sucesso' : 'E-mail salvo como rascunho')
    } catch (err: any) {
      toast.error(enviar ? `Erro ao enviar: ${err.message}` : 'Erro ao salvar e-mail')
    }
  }, [destinatario, assunto, corpo, oportunidadeId, emailContato, criarEmail])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botão compor */}
      <button
        type="button"
        onClick={handleToggleForm}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <Send className="w-3.5 h-3.5" />
        Compor e-mail
        {showForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Form compor */}
      {showForm && (
        <div className="p-3 border border-border rounded-lg space-y-2 bg-muted/30">
          <input
            type="email"
            value={destinatario}
            onChange={e => setDestinatario(e.target.value)}
            placeholder="Destinatário"
            className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            value={assunto}
            onChange={e => setAssunto(e.target.value)}
            placeholder="Assunto"
            className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <RichTextEditor
            value={corpo}
            onChange={setCorpo}
            placeholder="Mensagem..."
          />

          {/* Info de conexão + ações */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {smtpConectado ? (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Remetente: {emailRemetente}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-warning-foreground" />
                  Nenhuma conexão SMTP configurada. Configure em Configurações → Conexões.
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleEnviar(false)}
                disabled={!destinatario.trim() || !assunto.trim() || criarEmail.isPending}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-border text-foreground rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Rascunho
              </button>
              {smtpConectado && (
                <button
                  type="button"
                  onClick={() => handleEnviar(true)}
                  disabled={!destinatario.trim() || !assunto.trim() || criarEmail.isPending}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {criarEmail.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Enviar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lista de e-mails */}
      {(!emails || emails.length === 0) ? (
        <div className="text-center py-4">
          <Mail className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum e-mail registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map(email => (
            <EmailItem key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmailItem({ email }: { email: EmailOportunidade }) {
  const [expanded, setExpanded] = useState(false)
  const statusInfo = STATUS_MAP[email.status] || STATUS_MAP.pendente
  const StatusIcon = statusInfo.icon

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-accent/30 transition-colors"
      >
        <StatusIcon className={`w-3.5 h-3.5 flex-shrink-0 ${statusInfo.class}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{email.assunto || '(Sem assunto)'}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            Para: {email.destinatario}
            {' • '}
            {format(parseISO(email.criado_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusInfo.class} bg-muted`}>
          {statusInfo.label}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border">
          {/* AIDEV-NOTE: Sanitização XSS obrigatória (Auditoria C2) */}
          <div
            className="mt-2 text-sm text-foreground prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.corpo || '<p>(Sem conteúdo)</p>') }}
          />
          {email.erro_mensagem && (
            <p className="mt-2 text-xs text-destructive">
              Erro: {email.erro_mensagem}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
