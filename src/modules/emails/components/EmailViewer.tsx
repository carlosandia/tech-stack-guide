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
  onTraduzir?: (id: string) => Promise<string>
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
  // AIDEV-NOTE: Cores com opacidade para funcionar em light e dark mode
  const colors = [
    'bg-red-500/15 text-red-400',
    'bg-blue-500/15 text-blue-400',
    'bg-green-500/15 text-green-400',
    'bg-purple-500/15 text-purple-400',
    'bg-amber-500/15 text-amber-400',
    'bg-teal-500/15 text-teal-400',
    'bg-pink-500/15 text-pink-400',
    'bg-indigo-500/15 text-indigo-400',
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
      // AIDEV-NOTE: Encode multi-byte chars properly (emojis, acentos)
      const code = raw.codePointAt(i)!
      if (code > 127) {
        const encoded = new TextEncoder().encode(String.fromCodePoint(code))
        for (const b of encoded) bytes.push(b)
      } else {
        bytes.push(code)
      }
      i += code > 0xFFFF ? 2 : 1
    }
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
}

function looksLikeHtml(str: string): boolean {
  const t = str.trim()
  return /^<!DOCTYPE|^<html|^<head|^<body|^<table|^<div/i.test(t)
}

// AIDEV-NOTE: Decodifica corpo de uma parte MIME (quoted-printable ou base64)
function decodeMimePartBody(body: string, headers: string): string {
  if (headers.includes('base64')) {
    try {
      const clean = body.replace(/\s/g, '')
      const bin = atob(clean)
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    } catch { return body }
  }
  if (headers.includes('quoted-printable')) {
    return decodeQuotedPrintableString(body)
  }
  return body
}

// AIDEV-NOTE: Detecta se o texto parece ser MIME bruto (contém boundaries e headers MIME)
function looksLikeMime(str: string): boolean {
  return /This is a multi-part message|boundary=|^--[\S]{8,}\s*$/m.test(str)
}



// AIDEV-NOTE: Parser MIME frontend — extrai HTML de corpo MIME bruto quando backend falha
function extractHtmlFromMime(raw: string): string | null {
  // Tenta encontrar boundary via header Content-Type
  let boundary: string | null = null
  const boundaryMatch = raw.match(/boundary="?([^"\r\n;]+)"?/i)
  if (boundaryMatch) {
    boundary = boundaryMatch[1].trim()
  } else {
    // Fallback: detecta boundary pelo padrão "--<algo>" após preamble MIME
    // Aceita qualquer caractere não-whitespace (boundaries podem ter :, =, ?, etc.)
    const lineMatch = raw.match(/^--([\S]{8,})\s*$/m)
    if (lineMatch) {
      boundary = lineMatch[1]
      // Remove trailing : ou -- se presente (closing boundary artifact)
      boundary = boundary.replace(/:$/, '').replace(/--$/, '')
    }
  }
  if (!boundary) return null

  // Usa string split com boundary literal (não regex)
  const separator = '--' + boundary
  const parts = raw.split(separator)

  let htmlPart: string | null = null
  let textPart: string | null = null

  for (const part of parts) {
    // Pula preamble e closing
    if (part.trim() === '' || part.trim() === '--') continue

    const headerEnd = part.indexOf('\r\n\r\n') !== -1
      ? part.indexOf('\r\n\r\n')
      : part.indexOf('\n\n')
    if (headerEnd === -1) continue

    const headers = part.substring(0, headerEnd).toLowerCase()
    let body = part.substring(headerEnd).trim()

    // Remove trailing boundary closer (--) se presente no final do body
    body = body.replace(/\r?\n--\s*$/, '').trim()

    if (headers.includes('content-type')) {
      if (headers.includes('multipart/')) {
        // Nested multipart — recursivamente parseia
        const nested = extractHtmlFromMime(part)
        if (nested) htmlPart = nested
      } else if (headers.includes('text/html')) {
        htmlPart = decodeMimePartBody(body, headers)
      } else if (headers.includes('text/plain') && !textPart) {
        textPart = decodeMimePartBody(body, headers)
      }
    }
  }

  if (htmlPart) return htmlPart
  if (textPart) return `<pre style="white-space:pre-wrap;font-family:sans-serif;">${textPart}</pre>`
  return null
}

// AIDEV-NOTE: Detecta e decodifica strings base64 brutas (fallback para MIME parser)
function tryDecodeBase64(str: string): string | null {
  if (!str || str.length < 100) return null
  const trimmed = str.trim()
  // Verifica se parece base64: apenas chars válidos e comprimento razoável
  if (!/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) return null
  // Deve ter poucas quebras de linha relativas ao comprimento (não é texto normal)
  const nonWhitespace = trimmed.replace(/\s/g, '')
  if (nonWhitespace.length < 50) return null
  try {
    const binaryStr = atob(nonWhitespace)
    const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0))
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    // Verificar se o resultado é legível (não tem muitos chars de controle)
    const controlChars = decoded.replace(/[\x20-\x7E\xA0-\xFF\n\r\t]/g, '')
    if (controlChars.length > decoded.length * 0.1) return null
    return decoded
  } catch {
    return null
  }
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
  onTraduzir,
}: EmailViewerProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [traducao, setTraducao] = useState<string | null>(null)
  const [traduzindo, setTraduzindo] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const adjustIframeHeight = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc?.body) {
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 200)
        iframe.style.height = h + 'px'
      }
    } catch { /* sandbox */ }
  }, [])

  // AIDEV-NOTE: ResizeObserver + MutationObserver para altura dinâmica do iframe
  useEffect(() => {
    if (!email?.corpo_html && !email?.corpo_texto) return
    const iframe = iframeRef.current
    if (!iframe) return

    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null

    const setupObservers = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc?.body) return

        // ResizeObserver reage a mudanças de tamanho do conteúdo
        resizeObserver = new ResizeObserver(() => adjustIframeHeight())
        resizeObserver.observe(doc.body)

        // MutationObserver detecta imagens carregando, DOM changes
        mutationObserver = new MutationObserver(() => adjustIframeHeight())
        mutationObserver.observe(doc.body, { childList: true, subtree: true, attributes: true })
      } catch { /* sandbox restriction */ }
    }

    // Fallback: timeouts para garantir que altura seja ajustada
    const timers = [300, 800, 1500, 3000].map(ms =>
      setTimeout(() => {
        adjustIframeHeight()
        if (!resizeObserver) setupObservers()
      }, ms)
    )

    return () => {
      timers.forEach(clearTimeout)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [email?.id, adjustIframeHeight])

  // Reset translation when email changes
  useEffect(() => {
    setTraducao(null)
    setTraduzindo(false)
  }, [email?.id])

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

    // AIDEV-NOTE: Se corpo_html contém MIME bruto, extrair HTML dele primeiro
    if (html && looksLikeMime(html)) {
      const extracted = extractHtmlFromMime(html)
      if (extracted) {
        html = extracted
      } else {
        // MIME detectado mas sem parte HTML — limpar para tentar corpo_texto
        html = ''
      }
    }

    // Fallback: detect HTML stored in corpo_texto (MIME parser edge case)
    if (!html && email?.corpo_texto) {
      const text = email.corpo_texto.trim()

      // Primeiro tenta MIME parse (mais específico)
      if (looksLikeMime(text)) {
        const mimeExtracted = extractHtmlFromMime(text)
        if (mimeExtracted) {
          html = mimeExtracted
        }
      }

      if (!html) {
        if (looksLikeHtml(text) || text.includes('=3D"') || text.includes("=3D'")) {
          html = text
        } else {
          // AIDEV-NOTE: Fallback base64 — corpo pode estar codificado em base64 bruto
          const decoded = tryDecodeBase64(text)
          if (decoded && looksLikeHtml(decoded)) {
            html = decoded
          }
        }
      }
    }

    if (!html) return ''

    // Decode quoted-printable remnants if present
    if (html.includes('=3D') || /=\r?\n/.test(html)) {
      html = decodeQuotedPrintableString(html)
    }

    // AIDEV-NOTE: PRE-LIMPEZA — somente o que DOMPurify NÃO remove (Seg #2)
    // script/noscript são tratados por DOMPurify (FORBID_TAGS) — regex removidas (redundantes + frágeis)
    // Remover link tags que carregam scripts (DOMPurify preserva <link>)
    html = html.replace(/<link\b[^>]*\bas\s*=\s*["']?script["']?[^>]*\/?>/gi, '')
    // Remover referências ao tailwindcss CDN
    html = html.replace(/<link[^>]*cdn\.tailwindcss\.com[^>]*\/?>/gi, '')
    // Remover comentários condicionais do IE
    html = html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')

    // Sanitize — keep full document structure, styles, images
    const ALL_EVENT_HANDLERS = [
      'onerror','onload','onclick','ondblclick','onmouseover','onmouseout','onmouseenter',
      'onmouseleave','onmousedown','onmouseup','onmousemove','onfocus','onblur','onchange',
      'oninput','onsubmit','onreset','onkeydown','onkeyup','onkeypress','onscroll',
      'onresize','onhashchange','onpopstate','onbeforeunload','onunload','onmessage',
      'onanimationstart','onanimationend','onanimationiteration','ontransitionend',
      'ontouchstart','ontouchend','ontouchmove','ontouchcancel','onpointerdown',
      'onpointerup','onpointermove','oncontextmenu','ondrag','ondragstart','ondragend',
      'ondragover','ondragenter','ondragleave','ondrop','onwheel','oncopy','oncut','onpaste',
    ]

    let sanitized = DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['style'],
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script', 'noscript', 'iframe', 'object', 'embed', 'applet'],
      FORBID_ATTR: ALL_EVENT_HANDLERS,
    })

    // AIDEV-NOTE: CSP meta tag para silenciar warnings residuais no iframe sandbox
    const cspMeta = '<meta http-equiv="Content-Security-Policy" content="script-src \'none\'">'

    // AIDEV-NOTE: CSS de contenção - regras seguras que não quebram layout de tabelas de email
    // AIDEV-NOTE: CSS de contenção — fundo branco forçado (abordagem Gmail) para dark mode
    const containmentCss = `<style>
html, body { overflow-x: hidden !important; word-wrap: break-word; overflow-wrap: break-word; margin: 0; padding: 8px 16px; background: #ffffff !important; color: #1a1a1a !important; }
* { box-sizing: border-box; }
table { border-collapse: collapse; }
img { max-width: 100% !important; height: auto !important; }
pre, code { white-space: pre-wrap !important; word-break: break-all; }
a { word-break: break-all; color: #1a73e8; }
</style>`

    const charsetMeta = '<meta charset="utf-8">'

    // Inject <base target="_blank"> + CSP + charset + containment CSS
    if (sanitized.includes('<head>')) {
      return sanitized.replace('<head>', `<head>${charsetMeta}${cspMeta}${containmentCss}<base target="_blank">`)
    }
    return `<head>${charsetMeta}${cspMeta}${containmentCss}<base target="_blank"></head>${sanitized}`
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
      label: traduzindo ? 'Traduzindo...' : traducao ? 'Ver original' : 'Traduzir',
      icon: Languages,
      action: async () => {
        if (traducao) {
          setTraducao(null)
          return
        }
        if (onTraduzir && email) {
          setTraduzindo(true)
          try {
            const result = await onTraduzir(email.id)
            setTraducao(result)
            toast.success('Email traduzido')
          } catch (err) {
            toast.error((err as Error).message || 'Erro ao traduzir')
          } finally {
            setTraduzindo(false)
          }
        }
      },
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
          {/* Tracking status para emails enviados */}
          {email.pasta === 'sent' && email.tracking_id && (
            <div className="text-[10px] mt-1">
              {email.aberto_em ? (
                <span className="text-success flex items-center gap-1">
                  <MailOpen className="w-3 h-3" />
                  Aberto {email.total_aberturas}x — primeira abertura {format(new Date(email.aberto_em), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Não aberto
                </span>
              )}
            </div>
          )}
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
      <ContatoCard contatoId={email.contato_id} email={email.de_email} nome={email.de_nome} emailId={email.id} />

      {/* Email body */}
      <div className="flex-1 overflow-y-auto">
        {/* Translation banner */}
        {(traducao || traduzindo) && (
          <div className="px-5 py-2 bg-accent/30 border-b border-border/40 flex items-center gap-2">
            <Languages className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">
              {traduzindo ? 'Traduzindo...' : 'Tradução para Português'}
            </span>
            {traducao && (
              <button
                onClick={() => setTraducao(null)}
                className="text-xs text-primary hover:underline ml-auto"
              >
                Ver original
              </button>
            )}
          </div>
        )}

        {traducao ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed px-5 py-3">
            {traducao}
          </pre>
        ) : cleanHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={cleanHtml}
            sandbox="allow-popups allow-same-origin"
            className="w-full border-0"
            style={{ minHeight: '200px' }}
            onLoad={adjustIframeHeight}
            title="Conteúdo do email"
          />
        ) : email.corpo_texto ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed px-5 py-3">
            {tryDecodeBase64(email.corpo_texto) || email.corpo_texto}
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
