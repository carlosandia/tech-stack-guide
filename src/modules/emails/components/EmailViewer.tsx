/**
 * AIDEV-NOTE: Painel de visualização do email selecionado - Estilo Gmail
 * DOMPurify para sanitização HTML (XSS), Responder Todos, Download anexos, ContatoCard
 */

import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  MailOpen,
  Mail,
  Paperclip,
  ArrowLeft,
  Loader2,
  Download,
  MoreVertical,
  Smile,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { EmailRecebido, AnexoInfo } from '../types/email.types'
import { ContatoCard } from './ContatoCard'
import { emailsApi } from '../services/emails.api'

interface EmailViewerProps {
  email: EmailRecebido | null
  isLoading: boolean
  onBack: () => void
  onToggleLido: (id: string, lido: boolean) => void
  onToggleFavorito: (id: string, favorito: boolean) => void
  onArquivar: (id: string) => void
  onDeletar: (id: string) => void
  onResponder: (id: string) => void
  onResponderTodos: (id: string) => void
  onEncaminhar: (id: string) => void
}

function AnexoItem({ anexo, emailId }: { anexo: AnexoInfo; emailId: string }) {
  const tamanho =
    anexo.size < 1024
      ? `${anexo.size} B`
      : anexo.size < 1048576
      ? `${(anexo.size / 1024).toFixed(1)} KB`
      : `${(anexo.size / 1048576).toFixed(1)} MB`

  const handleDownload = async () => {
    try {
      const blob = await emailsApi.downloadAnexo(emailId, anexo.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = anexo.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="
        flex items-center gap-2 px-3 py-2.5 rounded-lg
        border border-border/50 bg-muted/20
        text-sm hover:bg-accent/40 transition-colors group
        min-w-[160px] max-w-[240px]
      "
    >
      <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium text-foreground truncate">{anexo.filename}</p>
        <p className="text-[10px] text-muted-foreground">{tamanho}</p>
      </div>
      <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  )
}

function getInitialColor(name: string): string {
  const colors = [
    'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-teal-100 text-teal-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
  ]
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function EmailViewer({
  email,
  isLoading,
  onBack,
  onToggleLido,
  onToggleFavorito,
  onArquivar,
  onDeletar,
  onResponder,
  onResponderTodos,
  onEncaminhar,
}: EmailViewerProps) {
  const cleanHtml = useMemo(() => {
    if (!email?.corpo_html) return ''
    const sanitized = DOMPurify.sanitize(email.corpo_html, {
      ADD_ATTR: ['target'],
    })
    return sanitized.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
  }, [email?.corpo_html])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Mail className="w-20 h-20 mb-4 opacity-10" />
        <p className="text-base font-medium opacity-40">Selecione um email para ler</p>
      </div>
    )
  }

  const nomeRemetente = email.de_nome || email.de_email
  const dataFormatada = format(new Date(email.data_email), "EEE, d 'de' MMM 'de' yyyy, HH:mm", {
    locale: ptBR,
  })
  const anexos: AnexoInfo[] = Array.isArray(email.anexos_info) ? email.anexos_info : []
  const avatarColor = getInitialColor(nomeRemetente)

  const iconBtnClass =
    'p-2 rounded-full hover:bg-accent/60 transition-colors text-muted-foreground hover:text-foreground'

  return (
    <div className="flex flex-col h-full">
      {/* Gmail-style action bar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border/40 flex-shrink-0">
        <button onClick={onBack} className={cn(iconBtnClass, 'md:hidden')}>
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <button onClick={() => onArquivar(email.id)} className={iconBtnClass} title="Arquivar">
          <Archive className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => onDeletar(email.id)}
          className={iconBtnClass}
          title="Excluir"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => onToggleLido(email.id, !email.lido)}
          className={iconBtnClass}
          title={email.lido ? 'Marcar como não lido' : 'Marcar como lido'}
        >
          {email.lido ? <Mail className="w-4.5 h-4.5" /> : <MailOpen className="w-4.5 h-4.5" />}
        </button>
        <div className="flex-1" />
      </div>

      {/* Subject */}
      <div className="px-6 pt-5 pb-2 flex-shrink-0">
        <h1 className="text-xl font-normal text-foreground leading-snug">
          {email.assunto || '(sem assunto)'}
        </h1>
      </div>

      {/* Sender info - Gmail style */}
      <div className="flex items-start gap-3 px-6 py-3 flex-shrink-0">
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
          avatarColor
        )}>
          {nomeRemetente[0]?.toUpperCase() || '?'}
        </div>

        {/* Sender details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{nomeRemetente}</span>
            <span className="text-xs text-muted-foreground">&lt;{email.de_email}&gt;</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            para {email.para_email}
            {email.cc_email && `, cc: ${email.cc_email}`}
          </p>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-xs text-muted-foreground mr-2 hidden lg:inline">
            {dataFormatada}
          </span>
          <button
            onClick={() => onToggleFavorito(email.id, !email.favorito)}
            className={iconBtnClass}
          >
            <Star className={cn(
              'w-4.5 h-4.5',
              email.favorito && 'fill-amber-400 text-amber-400'
            )} />
          </button>
          <button onClick={() => onResponder(email.id)} className={iconBtnClass} title="Responder">
            <Reply className="w-4.5 h-4.5" />
          </button>
          <button className={iconBtnClass}>
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* ContatoCard - CRM context */}
      <ContatoCard contatoId={email.contato_id} email={email.de_email} />

      {/* Email body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {cleanHtml ? (
          <div
            className="prose prose-sm max-w-none text-foreground [&_a]:text-primary"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        ) : email.corpo_texto ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {email.corpo_texto}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem conteúdo</p>
        )}
      </div>

      {/* Attachments */}
      {anexos.length > 0 && (
        <div className="px-6 py-3 border-t border-border/40 flex-shrink-0">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {anexos.length} anexo{anexos.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {anexos.map((anexo) => (
              <AnexoItem key={anexo.id} anexo={anexo} emailId={email.id} />
            ))}
          </div>
        </div>
      )}

      {/* Reply/Forward bar - Gmail style */}
      <div className="flex items-center gap-2 px-6 py-4 border-t border-border/40 flex-shrink-0">
        <button
          onClick={() => onResponder(email.id)}
          className="
            inline-flex items-center gap-2 h-9 px-5 rounded-full
            border border-border/60 text-sm font-medium text-foreground
            hover:bg-accent/50 hover:shadow-sm transition-all
          "
        >
          <Reply className="w-4 h-4" />
          Responder
        </button>
        <button
          onClick={() => onResponderTodos(email.id)}
          className="
            inline-flex items-center gap-2 h-9 px-5 rounded-full
            border border-border/60 text-sm font-medium text-foreground
            hover:bg-accent/50 hover:shadow-sm transition-all
          "
        >
          <ReplyAll className="w-4 h-4" />
          Responder a todos
        </button>
        <button
          onClick={() => onEncaminhar(email.id)}
          className="
            inline-flex items-center gap-2 h-9 px-5 rounded-full
            border border-border/60 text-sm font-medium text-foreground
            hover:bg-accent/50 hover:shadow-sm transition-all
          "
        >
          <Forward className="w-4 h-4" />
          Encaminhar
        </button>
        <button className={cn(iconBtnClass, 'ml-auto')}>
          <Smile className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  )
}
