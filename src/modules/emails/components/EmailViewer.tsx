/**
 * AIDEV-NOTE: Painel de visualização do email selecionado - Estilo Gmail
 * DOMPurify para sanitização HTML (XSS), Responder Todos, Download anexos, ContatoCard
 * Popover "mais ações" com: Responder, Encaminhar, Excluir, Marcar como não lido, Traduzir, Imprimir
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
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
  Languages,
  Printer,
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
        flex items-center gap-2 px-3 py-2 rounded-lg
        border border-border/50 bg-muted/20
        text-sm hover:bg-accent/40 transition-colors group
        min-w-[160px] max-w-[240px]
      "
    >
      <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium text-foreground truncate">{anexo.filename}</p>
        <p className="text-[11px] text-muted-foreground">{tamanho}</p>
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

function decodeQuotedPrintableString(str: string): string {
  const raw = str.replace(/=\r?\n/g, '')
  const bytes: number[] = []
  let i = 0
  while (i < raw.length) {
    if (raw[i] === '=' && i + 2 < raw.length && /^[0-9A-Fa-f]{2}$/.test(raw.substring(i + 1, i + 3))) {
      bytes.push(parseInt(raw.substring(i + 1, i + 3), 16))
      i += 3
    } else {
      bytes.push(raw.charCodeAt(i))
      i++
    }
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
}

function looksLikeHtml(str: string): boolean {
  const t = str.trim()
  return /^<!DOCTYPE|^<html|^<head|^<body|^<table|^<div/i.test(t)
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const adjustIframeHeight = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc?.body) {
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
        iframe.style.height = h + 'px'
      }
    } catch { /* sandbox */ }
  }, [])


  // Close popover on outside click
  useEffect(() => {
    if (!moreMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreMenuOpen])

  const cleanHtml = useMemo(() => {
    let html = email?.corpo_html || ''

    // Fallback: detect HTML stored in corpo_texto (MIME parser edge case)
    if (!html && email?.corpo_texto) {
      const text = email.corpo_texto.trim()
      if (looksLikeHtml(text) || text.includes('=3D"') || text.includes("=3D'")) {
        html = text
      }
    }

    if (!html) return ''

    // Decode quoted-printable remnants if present
    if (html.includes('=3D') || /=\r?\n/.test(html)) {
      html = decodeQuotedPrintableString(html)
    }

    // Sanitize — keep full document structure, styles, images
    const sanitized = DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['style'],
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    })

    // Inject <base target="_blank"> for links
    if (sanitized.includes('<head>')) {
      return sanitized.replace('<head>', '<head><base target="_blank">')
    }
    return `<head><base target="_blank"></head>${sanitized}`
  }, [email?.corpo_html, email?.corpo_texto])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Mail className="w-12 h-12 mb-3 opacity-10" />
        <p className="text-sm font-medium opacity-40">Selecione um email para ler</p>
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
    'p-1.5 rounded-full hover:bg-accent/60 transition-colors text-muted-foreground hover:text-foreground'

  const moreMenuItems: Array<{ label: string; icon: React.ElementType; action: () => void } | { divider: true }> = [
    {
      label: 'Responder',
      icon: Reply,
      action: () => onResponder(email.id),
    },
    {
      label: 'Encaminhar',
      icon: Forward,
      action: () => onEncaminhar(email.id),
    },
    { divider: true },
    {
      label: 'Excluir',
      icon: Trash2,
      action: () => onDeletar(email.id),
    },
    {
      label: email.lido ? 'Marcar como não lida' : 'Marcar como lida',
      icon: email.lido ? Mail : MailOpen,
      action: () => onToggleLido(email.id, !email.lido),
    },
    { divider: true },
    {
      label: 'Traduzir',
      icon: Languages,
      action: () => toast.info('Tradução será implementada em breve'),
    },
    {
      label: 'Imprimir',
      icon: Printer,
      action: () => window.print(),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border/40 flex-shrink-0">
        <button onClick={onBack} className={cn(iconBtnClass, 'md:hidden')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => onArquivar(email.id)} className={iconBtnClass} title="Arquivar">
          <Archive className="w-4 h-4" />
        </button>
        <button onClick={() => onDeletar(email.id)} className={iconBtnClass} title="Excluir">
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggleLido(email.id, !email.lido)}
          className={iconBtnClass}
          title={email.lido ? 'Marcar como não lido' : 'Marcar como lido'}
        >
          {email.lido ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
        </button>
        <div className="flex-1" />
      </div>

      {/* Subject */}
      <div className="px-5 pt-4 pb-1.5 flex-shrink-0">
        <h2 className="text-lg font-medium text-foreground leading-snug">
          {email.assunto || '(sem assunto)'}
        </h2>
      </div>

      {/* Sender info */}
      <div className="flex items-start gap-3 px-5 py-2.5 flex-shrink-0">
        {/* Avatar */}
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold',
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
              'w-4 h-4',
              email.favorito && 'fill-amber-400 text-amber-400'
            )} />
          </button>
          <button onClick={() => onResponder(email.id)} className={iconBtnClass} title="Responder">
            <Reply className="w-4 h-4" />
          </button>

          {/* More menu (3 dots) with popover */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={iconBtnClass}
              title="Mais ações"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                {moreMenuItems.map((item, i) => {
                  if ('divider' in item) {
                    return <div key={`d-${i}`} className="h-px bg-border my-1" />
                  }
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action()
                        setMoreMenuOpen(false)
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ContatoCard - CRM context */}
      <ContatoCard contatoId={email.contato_id} email={email.de_email} nome={email.de_nome} />

      {/* Email body */}
      <div className="flex-1 overflow-y-auto">
        {cleanHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={cleanHtml}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            className="w-full border-0"
            style={{ minHeight: '200px' }}
            onLoad={adjustIframeHeight}
            title="Conteúdo do email"
          />
        ) : email.corpo_texto ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed px-5 py-3">
            {email.corpo_texto}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground italic px-5 py-3">Sem conteúdo</p>
        )}
      </div>

      {/* Attachments */}
      {anexos.length > 0 && (
        <div className="px-5 py-2.5 border-t border-border/40 flex-shrink-0">
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

      {/* Reply/Forward bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-border/40 flex-shrink-0">
        <button
          onClick={() => onResponder(email.id)}
          className="
            inline-flex items-center gap-1.5 h-8 px-4 rounded-full
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
            inline-flex items-center gap-1.5 h-8 px-4 rounded-full
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
            inline-flex items-center gap-1.5 h-8 px-4 rounded-full
            border border-border/60 text-sm font-medium text-foreground
            hover:bg-accent/50 hover:shadow-sm transition-all
          "
        >
          <Forward className="w-4 h-4" />
          Encaminhar
        </button>
      </div>
    </div>
  )
}
