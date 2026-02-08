/**
 * AIDEV-NOTE: Painel de visualização do email selecionado
 * Exibe cabeçalho, corpo HTML e ações (responder, encaminhar, etc.)
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Reply,
  Forward,
  Archive,
  Trash2,
  Star,
  MailOpen,
  Mail,
  Paperclip,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EmailRecebido, AnexoInfo } from '../types/email.types'

interface EmailViewerProps {
  email: EmailRecebido | null
  isLoading: boolean
  onBack: () => void
  onToggleLido: (id: string, lido: boolean) => void
  onToggleFavorito: (id: string, favorito: boolean) => void
  onArquivar: (id: string) => void
  onDeletar: (id: string) => void
  onResponder: (id: string) => void
  onEncaminhar: (id: string) => void
}

function AnexoItem({ anexo }: { anexo: AnexoInfo }) {
  const tamanho = anexo.size < 1024
    ? `${anexo.size} B`
    : anexo.size < 1048576
    ? `${(anexo.size / 1024).toFixed(1)} KB`
    : `${(anexo.size / 1048576).toFixed(1)} MB`

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/60 bg-muted/30 text-sm">
      <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="truncate flex-1 text-foreground">{anexo.filename}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0">{tamanho}</span>
    </div>
  )
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
  onEncaminhar,
}: EmailViewerProps) {
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
        <Mail className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Selecione um email para visualizar</p>
      </div>
    )
  }

  const nomeRemetente = email.de_nome || email.de_email
  const dataFormatada = format(new Date(email.data_email), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  const anexos: AnexoInfo[] = Array.isArray(email.anexos_info) ? email.anexos_info : []

  const iconBtnClass = 'p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground'

  return (
    <div className="flex flex-col h-full">
      {/* Header com ações */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 flex-shrink-0">
        {/* Botão voltar (mobile) */}
        <button onClick={onBack} className={cn(iconBtnClass, 'md:hidden')}>
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => onToggleLido(email.id, !email.lido)}
          className={iconBtnClass}
          title={email.lido ? 'Marcar como não lido' : 'Marcar como lido'}
        >
          {email.lido ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onToggleFavorito(email.id, !email.favorito)}
          className={iconBtnClass}
          title={email.favorito ? 'Remover favorito' : 'Favoritar'}
        >
          <Star className={cn('w-4 h-4', email.favorito && 'fill-amber-400 text-amber-400')} />
        </button>

        <button onClick={() => onArquivar(email.id)} className={iconBtnClass} title="Arquivar">
          <Archive className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDeletar(email.id)}
          className={cn(iconBtnClass, 'text-destructive hover:text-destructive')}
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Assunto */}
      <div className="px-4 py-3 border-b border-border/60 flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">
          {email.assunto || '(sem assunto)'}
        </h2>
      </div>

      {/* Remetente + Data */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border/60 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary">
            {nomeRemetente[0]?.toUpperCase() || '?'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{nomeRemetente}</span>
            <span className="text-xs text-muted-foreground">&lt;{email.de_email}&gt;</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            para {email.para_email}
            {email.cc_email && `, cc: ${email.cc_email}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{dataFormatada}</p>
        </div>
      </div>

      {/* Corpo do email */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {email.corpo_html ? (
          <div
            className="prose prose-sm max-w-none text-foreground [&_a]:text-primary"
            dangerouslySetInnerHTML={{ __html: email.corpo_html }}
          />
        ) : email.corpo_texto ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
            {email.corpo_texto}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem conteúdo</p>
        )}
      </div>

      {/* Anexos */}
      {anexos.length > 0 && (
        <div className="px-4 py-3 border-t border-border/60 flex-shrink-0">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {anexos.length} anexo{anexos.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {anexos.map((anexo) => (
              <AnexoItem key={anexo.id} anexo={anexo} />
            ))}
          </div>
        </div>
      )}

      {/* Ações de resposta */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border/60 flex-shrink-0">
        <button
          onClick={() => onResponder(email.id)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Reply className="w-4 h-4" />
          Responder
        </button>
        <button
          onClick={() => onEncaminhar(email.id)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Forward className="w-4 h-4" />
          Encaminhar
        </button>
      </div>
    </div>
  )
}
