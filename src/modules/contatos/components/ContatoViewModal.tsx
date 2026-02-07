/**
 * AIDEV-NOTE: Modal de visualização de contato com abas
 * Conforme PRD-06 e Design System 10.5 - Modal/Dialog
 * - z-index: overlay 400, content 401
 * - Overlay: bg-black/80 backdrop-blur-sm
 * - Estrutura flex-col: header fixo, content scrollable, footer fixo
 * - Responsividade: w-[calc(100%-32px)] mobile, max-w-2xl desktop
 * - ARIA, ESC to close, focus trap
 */

import { useEffect, useRef, useId, useState, useCallback } from 'react'
import { X, Pencil, Trash2, Building2, User, Briefcase } from 'lucide-react'
import { SegmentoBadge } from './SegmentoBadge'
import { ContatoViewFieldsToggle, isViewFieldVisible } from './ContatoViewFieldsToggle'
import type { Contato } from '../services/contatos.api'
import { StatusContatoOptions, OrigemContatoOptions } from '../schemas/contatos.schema'
import { useCamposConfig } from '../hooks/useCamposConfig'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ContatoViewModalProps {
  open: boolean
  onClose: () => void
  contato: Contato | null
  onEdit: () => void
  onDelete: () => void
}

export function ContatoViewModal({ open, onClose, contato, onEdit, onDelete }: ContatoViewModalProps) {
  const [activeTab, setActiveTab] = useState<'dados' | 'historico'>('dados')
  const [, setRefreshKey] = useState(0)
  const contatoTipo = contato?.tipo || 'pessoa'
  const { getLabel } = useCamposConfig(contatoTipo as 'pessoa' | 'empresa')
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const handleVisibilityChange = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  // ESC to close + focus trap
  useEffect(() => {
    if (!open) return

    const prev = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      prev?.focus()
    }
  }, [open, onClose])

  if (!open || !contato) return null

  const isPessoa = contato.tipo === 'pessoa'
  const tipo = contato.tipo
  const nomeExibicao = isPessoa
    ? [contato.nome, contato.sobrenome].filter(Boolean).join(' ')
    : contato.nome_fantasia || contato.razao_social || 'Sem nome'

  const statusLabel = StatusContatoOptions.find(s => s.value === contato.status)?.label || contato.status
  const origemLabel = OrigemContatoOptions.find(o => o.value === contato.origem)?.label || contato.origem

  const isVisible = (key: string, obrigatorio = false) => isViewFieldVisible(tipo, key, obrigatorio)

  const criadoEm = contato.criado_em
    ? format(new Date(contato.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null
  const atualizadoEm = contato.atualizado_em
    ? format(new Date(contato.atualizado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null

  return (
    <>
      {/* Overlay - z-400 */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container - z-401 */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="
            pointer-events-auto
            bg-card border border-border rounded-lg shadow-lg
            flex flex-col
            w-[calc(100%-16px)] sm:w-[calc(100%-32px)] sm:max-w-2xl
            max-h-[calc(100dvh-16px)] sm:max-h-[85vh]
          "
        >
          {/* Header - fixo */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {isPessoa ? <User className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <h2 id={titleId} className="text-lg font-semibold text-foreground truncate">{nomeExibicao}</h2>
                  <p className="text-xs text-muted-foreground">{isPessoa ? 'Pessoa' : 'Empresa'} · {statusLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ContatoViewFieldsToggle tipo={tipo} onChange={handleVisibilityChange} />
                <button onClick={onEdit} className="p-2 hover:bg-accent rounded-md transition-all duration-200" title="Editar">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={onDelete} className="p-2 hover:bg-destructive/10 rounded-md transition-all duration-200" title="Excluir">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-all duration-200" aria-label="Fechar">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex mt-3 -mb-4 border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('dados')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'dados' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Dados do Contato
              </button>
              <button
                onClick={() => setActiveTab('historico')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === 'historico' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Histórico ({contato.total_oportunidades || 0})
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 min-h-0 overscroll-contain">
            {activeTab === 'dados' && (
              <div className="space-y-5">
                {/* Segmentos */}
                {isVisible('segmentos') && contato.segmentos && contato.segmentos.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Segmentação</label>
                    <div className="flex flex-wrap gap-1.5">
                      {contato.segmentos.map((s) => (
                        <SegmentoBadge key={s.id} nome={s.nome} cor={s.cor} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Campos do contato */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isPessoa ? (
                    <>
                      {isVisible('nome', true) && <Field label={getLabel('nome', 'Nome')} value={contato.nome} />}
                      {isVisible('sobrenome') && <Field label={getLabel('sobrenome', 'Sobrenome')} value={contato.sobrenome} />}
                      {isVisible('email') && <Field label={getLabel('email', 'Email')} value={contato.email} />}
                      {isVisible('telefone') && <Field label={getLabel('telefone', 'Telefone')} value={contato.telefone} />}
                      {isVisible('cargo') && <Field label={getLabel('cargo', 'Cargo')} value={contato.cargo} />}
                      {isVisible('linkedin_url') && <Field label={getLabel('linkedin_url', 'LinkedIn')} value={contato.linkedin_url} isLink />}
                      {isVisible('empresa') && <Field label="Empresa" value={contato.empresa?.nome_fantasia || contato.empresa?.razao_social} />}
                      {isVisible('responsavel') && <Field label="Responsável" value={contato.owner ? `${contato.owner.nome} ${contato.owner.sobrenome || ''}`.trim() : undefined} />}
                    </>
                  ) : (
                    <>
                      {isVisible('razao_social', true) && <Field label={getLabel('razao_social', 'Razão Social')} value={contato.razao_social} />}
                      {isVisible('nome_fantasia') && <Field label={getLabel('nome_fantasia', 'Nome Fantasia')} value={contato.nome_fantasia} />}
                      {isVisible('cnpj') && <Field label={getLabel('cnpj', 'CNPJ')} value={contato.cnpj} />}
                      {isVisible('email') && <Field label={getLabel('email', 'Email')} value={contato.email} />}
                      {isVisible('telefone') && <Field label={getLabel('telefone', 'Telefone')} value={contato.telefone} />}
                      {isVisible('website') && <Field label={getLabel('website', 'Website')} value={contato.website} isLink />}
                      {isVisible('segmento') && <Field label={getLabel('segmento', 'Segmento de Mercado')} value={contato.segmento} />}
                      {isVisible('porte') && <Field label={getLabel('porte', 'Porte')} value={contato.porte} />}
                    </>
                  )}
                  {isVisible('status', true) && <Field label="Status" value={statusLabel} />}
                  {isVisible('origem') && <Field label="Origem" value={origemLabel} />}
                </div>

                {isVisible('observacoes') && contato.observacoes && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Observações</label>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{contato.observacoes}</p>
                  </div>
                )}

                {/* Pessoas vinculadas (para empresas) */}
                {!isPessoa && isVisible('pessoas') && contato.pessoas && contato.pessoas.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                      Pessoas vinculadas ({contato.pessoas.length})
                    </label>
                    <div className="space-y-2">
                      {contato.pessoas.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {p.nome} {p.sobrenome || ''}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[p.cargo, p.email].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'historico' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {contato.total_oportunidades
                    ? `${contato.total_oportunidades} oportunidade(s) vinculada(s)`
                    : 'Nenhuma oportunidade vinculada'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O histórico completo estará disponível no módulo de Negócios.
                </p>
              </div>
            )}
          </div>

          {/* Footer - fixo com datas */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-t border-border bg-card rounded-b-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-muted-foreground">
              <span>{criadoEm ? `Criado em ${criadoEm}` : ''}</span>
              <span>{atualizadoEm ? `Atualizado em ${atualizadoEm}` : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, value, isLink }: { label: string; value?: string | null; isLink?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {value ? (
        isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline truncate">
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground/50">—</p>
      )}
    </div>
  )
}
