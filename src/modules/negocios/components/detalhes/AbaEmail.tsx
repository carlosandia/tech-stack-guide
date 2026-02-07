/**
 * AIDEV-NOTE: Aba E-mail (RF-14.3 Tab 4) - Implementação completa
 * Compor e-mail com editor rich text (RichTextEditor), histórico de e-mails
 */

import { useState, useCallback } from 'react'
import { Mail, Send, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEmailsOportunidade, useCriarEmail } from '../../hooks/useDetalhes'
import { RichTextEditor } from '@/modules/configuracoes/components/editor/RichTextEditor'
import type { EmailOportunidade } from '../../services/detalhes.api'

interface AbaEmailProps {
  oportunidadeId: string
  emailContato?: string | null
}

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle2; class: string }> = {
  enviado: { label: 'Enviado', icon: CheckCircle2, class: 'text-emerald-600' },
  rascunho: { label: 'Rascunho', icon: Clock, class: 'text-amber-600' },
  falhou: { label: 'Falhou', icon: AlertCircle, class: 'text-destructive' },
  pendente: { label: 'Pendente', icon: Clock, class: 'text-muted-foreground' },
}

export function AbaEmail({ oportunidadeId, emailContato }: AbaEmailProps) {
  const { data: emails, isLoading } = useEmailsOportunidade(oportunidadeId)
  const criarEmail = useCriarEmail()

  const [showForm, setShowForm] = useState(false)
  const [destinatario, setDestinatario] = useState(emailContato || '')
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')

  const handleEnviar = useCallback(async () => {
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
      })
      setDestinatario(emailContato || '')
      setAssunto('')
      setCorpo('')
      setShowForm(false)
      toast.success('E-mail salvo como rascunho')
    } catch {
      toast.error('Erro ao salvar e-mail')
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
        onClick={() => setShowForm(!showForm)}
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
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground">
              E-mail será salvo como rascunho. Envio requer conexão SMTP configurada.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviar}
                disabled={!destinatario.trim() || !assunto.trim() || criarEmail.isPending}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {criarEmail.isPending ? 'Salvando...' : 'Salvar rascunho'}
              </button>
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
          <div
            className="mt-2 text-sm text-foreground prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: email.corpo || '<p>(Sem conteúdo)</p>' }}
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
