/**
 * AIDEV-NOTE: Página principal da Caixa de Entrada de Email (PRD-11) - Layout estilo Gmail
 * 3 colunas: Sidebar (pastas) | Lista de emails | Visualização
 * Responsivo: mobile mostra uma coluna por vez
 */

import { useState, useEffect, useCallback } from 'react'
import { Settings2 } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { EmailSidebar } from '../components/EmailSidebar'
import { EmailList } from '../components/EmailList'
import { EmailViewer } from '../components/EmailViewer'
import { ComposeEmailModal, type ComposerMode } from '../components/ComposeEmailModal'
import { AssinaturaModal } from '../components/AssinaturaModal'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import type { EmailFiltros } from '../components/EmailFilters'
import {
  useEmails,
  useEmail,
  useContadorNaoLidos,
  useAtualizarEmail,
  useDeletarEmail,
  useAcaoLote,
  useEnviarEmail,
  useNewEmailNotification,
  useSincronizarEmails,
  useSalvarRascunho,
} from '../hooks/useEmails'
import type { PastaEmail, AcaoLote } from '../types/email.types'

// Extended type to include "starred" virtual folder
type PastaEmailExtended = PastaEmail | 'starred'

export function EmailsPage() {
  const [pasta, setPasta] = useState<PastaEmailExtended>('inbox')
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<EmailFiltros>({})

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerMode, setComposerMode] = useState<ComposerMode>('novo')
  const [composerResetKey, setComposerResetKey] = useState(0)
  const [composerDefaults, setComposerDefaults] = useState<{
    para_email?: string
    cc_email?: string
    assunto?: string
    corpo_html?: string
  }>()

  // Modais
  const [assinaturaOpen, setAssinaturaOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[] } | null>(null)

  // Toolbar actions
  const { setActions } = useAppToolbar()

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setAssinaturaOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Assinatura"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Assinatura</span>
        </button>
      </div>
    )
    return () => setActions(null)
  }, [setActions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build query params - "starred" maps to favorito filter on inbox
  const queryPasta: PastaEmail = pasta === 'starred' ? 'inbox' : pasta
  const queryFiltros = pasta === 'starred' ? { ...filtros, favorito: true } : filtros

  // Queries
  const { data: emailsData, isLoading, refetch } = useEmails({
    pasta: queryPasta,
    busca,
    page,
    per_page: 20,
    ...queryFiltros,
  })
  const { data: selectedEmail, isLoading: loadingEmail } = useEmail(selectedId)
  const { data: naoLidos } = useContadorNaoLidos()

  // Mutations
  const atualizarEmail = useAtualizarEmail()
  const deletarEmail = useDeletarEmail()
  const acaoLote = useAcaoLote()
  const enviarEmail = useEnviarEmail()
  const salvarRascunho = useSalvarRascunho()

  // Sincronização IMAP
  const sincronizarEmails = useSincronizarEmails()

  // Notificação de novos emails
  useNewEmailNotification()

  // Auto-marcar como lido ao selecionar
  useEffect(() => {
    if (selectedEmail && !selectedEmail.lido) {
      atualizarEmail.mutate({ id: selectedEmail.id, payload: { lido: true } })
    }
  }, [selectedEmail?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page ao mudar pasta/busca/filtros
  useEffect(() => {
    setPage(1)
    setSelectedId(null)
  }, [pasta, busca, filtros])

  // =====================================================
  // Handlers
  // =====================================================

  const openComposer = useCallback(
    (mode: ComposerMode, defaults?: typeof composerDefaults) => {
      setComposerMode(mode)
      setComposerDefaults(defaults)
      setComposerOpen(true)
      setComposerResetKey((k) => k + 1)
    },
    []
  )

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

  const handleDeletar = useCallback((id: string) => {
    setPendingDelete({ ids: [id] })
  }, [])

  const handleAcaoLote = useCallback(
    (acao: AcaoLote, ids: string[]) => {
      if (acao === 'mover_lixeira') {
        setPendingDelete({ ids })
        return
      }
      acaoLote.mutate({ ids, acao })
      if (selectedId && ids.includes(selectedId)) {
        setSelectedId(null)
      }
    },
    [acaoLote, selectedId]
  )

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return
    if (pendingDelete.ids.length === 1) {
      deletarEmail.mutate(pendingDelete.ids[0])
    } else {
      acaoLote.mutate({ ids: pendingDelete.ids, acao: 'mover_lixeira' })
    }
    if (selectedId && pendingDelete.ids.includes(selectedId)) {
      setSelectedId(null)
    }
    setPendingDelete(null)
  }, [pendingDelete, deletarEmail, acaoLote, selectedId])

  const getEmailData = useCallback(
    (id: string) => {
      return emailsData?.data.find((e) => e.id === id) || selectedEmail
    },
    [emailsData, selectedEmail]
  )

  const handleResponder = useCallback(
    (id: string) => {
      const email = getEmailData(id)
      if (!email) return
      openComposer('responder', {
        para_email: email.de_email,
        assunto: `Re: ${email.assunto || ''}`,
        corpo_html: `<br/><br/><hr/><p>Em ${new Date(email.data_email).toLocaleDateString('pt-BR')}, ${email.de_nome || email.de_email} escreveu:</p><blockquote>${email.corpo_html || email.corpo_texto || ''}</blockquote>`,
      })
    },
    [getEmailData, openComposer]
  )

  const handleResponderTodos = useCallback(
    (id: string) => {
      const email = getEmailData(id)
      if (!email) return
      openComposer('responder_todos', {
        para_email: email.de_email,
        cc_email: email.cc_email || undefined,
        assunto: `Re: ${email.assunto || ''}`,
        corpo_html: `<br/><br/><hr/><p>Em ${new Date(email.data_email).toLocaleDateString('pt-BR')}, ${email.de_nome || email.de_email} escreveu:</p><blockquote>${email.corpo_html || email.corpo_texto || ''}</blockquote>`,
      })
    },
    [getEmailData, openComposer]
  )

  const handleEncaminhar = useCallback(
    (id: string) => {
      const email = getEmailData(id)
      if (!email) return
      openComposer('encaminhar', {
        assunto: `Fwd: ${email.assunto || ''}`,
        corpo_html: `<br/><br/><hr/><p>---------- Mensagem encaminhada ----------</p><p>De: ${email.de_nome || email.de_email}<br/>Assunto: ${email.assunto || ''}</p><hr/>${email.corpo_html || email.corpo_texto || ''}`,
      })
    },
    [getEmailData, openComposer]
  )

  const handleSend = useCallback(
    (data: { para_email: string; cc_email?: string; bcc_email?: string; assunto: string; corpo_html: string }) => {
      enviarEmail.mutate(data, {
        onSuccess: () => setComposerOpen(false),
      })
    },
    [enviarEmail]
  )

  const handleSaveDraft = useCallback(
    (data: { para_email?: string; cc_email?: string; bcc_email?: string; assunto?: string; corpo_html?: string; tipo?: 'novo' | 'resposta' | 'encaminhar' }) => {
      salvarRascunho.mutate(data, {
        onSuccess: () => setComposerOpen(false),
      })
    },
    [salvarRascunho]
  )

  const emails = emailsData?.data || []
  const total = emailsData?.total || 0
  const totalPages = emailsData?.total_pages || 1

  return (
    <div className="flex h-full bg-background">
      {/* Gmail-style Sidebar - hidden on mobile */}
      <div className="hidden lg:flex">
        <EmailSidebar
          pasta={pasta}
          setPasta={setPasta}
          naoLidosInbox={naoLidos?.inbox || 0}
          onCompose={() => openComposer('novo')}
        />
      </div>

      {/* Email List */}
      <div
        className={`
          w-full lg:w-auto lg:min-w-[320px] lg:max-w-[380px] flex-shrink-0
          ${selectedId ? 'hidden md:flex md:flex-col' : 'flex flex-col'}
        `}
      >
        <EmailList
          emails={emails}
          total={total}
          isLoading={isLoading}
          busca={busca}
          setBusca={setBusca}
          selectedId={selectedId}
          onSelect={handleSelect}
          onToggleFavorito={handleToggleFavorito}
          onAcaoLote={handleAcaoLote}
          onRefresh={() => {
            sincronizarEmails.mutate()
            refetch()
          }}
          isSyncing={sincronizarEmails.isPending}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          filtros={filtros}
          setFiltros={setFiltros}
        />
      </div>

      {/* Email Viewer */}
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
          onResponderTodos={handleResponderTodos}
          onEncaminhar={handleEncaminhar}
        />
      </div>

      {/* Composer Modal */}
      <ComposeEmailModal
        mode={composerMode}
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSend={handleSend}
        onSaveDraft={handleSaveDraft}
        isSending={enviarEmail.isPending}
        isSavingDraft={salvarRascunho.isPending}
        defaults={composerDefaults}
        resetKey={composerResetKey}
      />

      {/* Assinatura Modal */}
      <AssinaturaModal isOpen={assinaturaOpen} onClose={() => setAssinaturaOpen(false)} />

      {/* Confirmação de exclusão */}
      <ConfirmDeleteDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={deletarEmail.isPending || acaoLote.isPending}
        count={pendingDelete?.ids.length}
      />
    </div>
  )
}

export default EmailsPage
