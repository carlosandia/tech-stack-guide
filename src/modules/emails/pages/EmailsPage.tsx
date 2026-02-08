/**
 * AIDEV-NOTE: Página principal da Caixa de Entrada de Email (PRD-11)
 * Layout split-view: lista de emails à esquerda + visualização à direita
 * Responsivo: mobile mostra uma coluna por vez
 */

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { EmailList } from '../components/EmailList'
import { EmailViewer } from '../components/EmailViewer'
import { ComposeEmailModal, type ComposerMode } from '../components/ComposeEmailModal'
import {
  useEmails,
  useEmail,
  useContadorNaoLidos,
  useAtualizarEmail,
  useDeletarEmail,
  useAcaoLote,
} from '../hooks/useEmails'
import type { PastaEmail, AcaoLote } from '../types/email.types'
import { toast } from 'sonner'

export function EmailsPage() {
  const [pasta, setPasta] = useState<PastaEmail>('inbox')
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerMode, setComposerMode] = useState<ComposerMode>('novo')
  const [composerDefaults, setComposerDefaults] = useState<{
    para_email?: string
    assunto?: string
    corpo_html?: string
  }>()

  // Toolbar actions
  const { setActions } = useAppToolbar()

  useEffect(() => {
    setActions(
      <button
        onClick={() => {
          setComposerMode('novo')
          setComposerDefaults(undefined)
          setComposerOpen(true)
        }}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo Email</span>
      </button>
    )
    return () => setActions(null)
  }, [setActions])

  // Queries
  const { data: emailsData, isLoading, refetch } = useEmails({ pasta, busca, page, per_page: 20 })
  const { data: selectedEmail, isLoading: loadingEmail } = useEmail(selectedId)
  const { data: naoLidos } = useContadorNaoLidos()

  // Mutations
  const atualizarEmail = useAtualizarEmail()
  const deletarEmail = useDeletarEmail()
  const acaoLote = useAcaoLote()

  // Auto-marcar como lido ao selecionar
  useEffect(() => {
    if (selectedEmail && !selectedEmail.lido) {
      atualizarEmail.mutate({ id: selectedEmail.id, payload: { lido: true } })
    }
  }, [selectedEmail?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page ao mudar pasta/busca
  useEffect(() => {
    setPage(1)
    setSelectedId(null)
  }, [pasta, busca])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleToggleFavorito = useCallback(
    (id: string, favorito: boolean) => {
      atualizarEmail.mutate({ id, payload: { favorito } })
    },
    [atualizarEmail]
  )

  const handleToggleLido = useCallback(
    (id: string, lido: boolean) => {
      atualizarEmail.mutate({ id, payload: { lido } })
    },
    [atualizarEmail]
  )

  const handleArquivar = useCallback(
    (id: string) => {
      atualizarEmail.mutate({ id, payload: { pasta: 'archived' } })
      setSelectedId(null)
    },
    [atualizarEmail]
  )

  const handleDeletar = useCallback(
    (id: string) => {
      deletarEmail.mutate(id)
      setSelectedId(null)
    },
    [deletarEmail]
  )

  const handleAcaoLote = useCallback(
    (acao: AcaoLote, ids: string[]) => {
      acaoLote.mutate({ ids, acao })
      if (selectedId && ids.includes(selectedId)) {
        setSelectedId(null)
      }
    },
    [acaoLote, selectedId]
  )

  const handleResponder = useCallback(
    (id: string) => {
      const email = emailsData?.data.find((e) => e.id === id) || selectedEmail
      if (!email) return
      setComposerMode('responder')
      setComposerDefaults({
        para_email: email.de_email,
        assunto: `Re: ${email.assunto || ''}`,
        corpo_html: `<br/><br/><hr/><p>Em ${new Date(email.data_email).toLocaleDateString('pt-BR')}, ${email.de_nome || email.de_email} escreveu:</p><blockquote>${email.corpo_html || email.corpo_texto || ''}</blockquote>`,
      })
      setComposerOpen(true)
    },
    [emailsData, selectedEmail]
  )

  const handleEncaminhar = useCallback(
    (id: string) => {
      const email = emailsData?.data.find((e) => e.id === id) || selectedEmail
      if (!email) return
      setComposerMode('encaminhar')
      setComposerDefaults({
        assunto: `Fwd: ${email.assunto || ''}`,
        corpo_html: `<br/><br/><hr/><p>---------- Mensagem encaminhada ----------</p><p>De: ${email.de_nome || email.de_email}<br/>Assunto: ${email.assunto || ''}</p><hr/>${email.corpo_html || email.corpo_texto || ''}`,
      })
      setComposerOpen(true)
    },
    [emailsData, selectedEmail]
  )

  const handleSend = useCallback(
    (_data: { para_email: string; assunto: string; corpo_html: string }) => {
      // TODO: Integrar com backend de envio quando endpoint estiver disponível
      toast.info('Funcionalidade de envio será integrada com o backend em breve')
      setComposerOpen(false)
    },
    []
  )

  const emails = emailsData?.data || []
  const total = emailsData?.total || 0
  const totalPages = emailsData?.total_pages || 1

  return (
    <div className="flex h-full">
      {/* Lista de emails - 380px fixo no desktop, full no mobile */}
      <div
        className={`
          w-full md:w-[380px] md:min-w-[380px] md:max-w-[380px] flex-shrink-0
          ${selectedId ? 'hidden md:flex md:flex-col' : 'flex flex-col'}
        `}
      >
        <EmailList
          emails={emails}
          total={total}
          isLoading={isLoading}
          pasta={pasta}
          setPasta={setPasta}
          busca={busca}
          setBusca={setBusca}
          selectedId={selectedId}
          onSelect={handleSelect}
          onToggleFavorito={handleToggleFavorito}
          onAcaoLote={handleAcaoLote}
          onRefresh={() => refetch()}
          naoLidosInbox={naoLidos?.inbox || 0}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Visualizador de email */}
      <div
        className={`
          flex-1 min-w-0
          ${!selectedId ? 'hidden md:flex md:flex-col' : 'flex flex-col'}
        `}
      >
        <EmailViewer
          email={selectedEmail || null}
          isLoading={loadingEmail}
          onBack={() => setSelectedId(null)}
          onToggleLido={handleToggleLido}
          onToggleFavorito={handleToggleFavorito}
          onArquivar={handleArquivar}
          onDeletar={handleDeletar}
          onResponder={handleResponder}
          onEncaminhar={handleEncaminhar}
        />
      </div>

      {/* Composer Modal */}
      <ComposeEmailModal
        mode={composerMode}
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSend={handleSend}
        isSending={false}
        defaults={composerDefaults}
      />
    </div>
  )
}

export default EmailsPage
