/**
 * AIDEV-NOTE: Modal de visualização de contato com abas
 * Conforme PRD-06 e Design System - Modal rounded-lg shadow-lg p-6
 */

import { X, Pencil, Trash2, Building2, User, Briefcase } from 'lucide-react'
import { SegmentoBadge } from './SegmentoBadge'
import type { Contato } from '../services/contatos.api'
import { StatusContatoOptions, OrigemContatoOptions } from '../schemas/contatos.schema'
import { useState } from 'react'

interface ContatoViewModalProps {
  open: boolean
  onClose: () => void
  contato: Contato | null
  onEdit: () => void
  onDelete: () => void
}

export function ContatoViewModal({ open, onClose, contato, onEdit, onDelete }: ContatoViewModalProps) {
  const [activeTab, setActiveTab] = useState<'dados' | 'historico'>('dados')

  if (!open || !contato) return null

  const isPessoa = contato.tipo === 'pessoa'
  const nomeExibicao = isPessoa
    ? [contato.nome, contato.sobrenome].filter(Boolean).join(' ')
    : contato.nome_fantasia || contato.razao_social || 'Sem nome'

  const statusLabel = StatusContatoOptions.find(s => s.value === contato.status)?.label || contato.status
  const origemLabel = OrigemContatoOptions.find(o => o.value === contato.origem)?.label || contato.origem

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {isPessoa ? <User className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">{nomeExibicao}</h3>
              <p className="text-xs text-muted-foreground">{isPessoa ? 'Pessoa' : 'Empresa'} · {statusLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onEdit} className="p-2 hover:bg-accent rounded-md transition-colors" title="Editar">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={onDelete} className="p-2 hover:bg-destructive/10 rounded-md transition-colors" title="Excluir">
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {isPessoa && (
          <div className="flex border-b border-border px-6">
            <button
              onClick={() => setActiveTab('dados')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dados' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Dados do Contato
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'historico' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Histórico ({contato.total_oportunidades || 0})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'dados' && (
            <>
              {/* Segmentos */}
              {contato.segmentos && contato.segmentos.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Segmentação</label>
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
                    <Field label="Nome" value={contato.nome} />
                    <Field label="Sobrenome" value={contato.sobrenome} />
                    <Field label="Email" value={contato.email} />
                    <Field label="Telefone" value={contato.telefone} />
                    <Field label="Cargo" value={contato.cargo} />
                    <Field label="LinkedIn" value={contato.linkedin_url} isLink />
                    <Field label="Empresa" value={contato.empresa?.nome_fantasia || contato.empresa?.razao_social} />
                    <Field label="Responsável" value={contato.owner ? `${contato.owner.nome} ${contato.owner.sobrenome || ''}`.trim() : undefined} />
                  </>
                ) : (
                  <>
                    <Field label="Razão Social" value={contato.razao_social} />
                    <Field label="Nome Fantasia" value={contato.nome_fantasia} />
                    <Field label="CNPJ" value={contato.cnpj} />
                    <Field label="Email" value={contato.email} />
                    <Field label="Telefone" value={contato.telefone} />
                    <Field label="Website" value={contato.website} isLink />
                    <Field label="Segmento de Mercado" value={contato.segmento} />
                    <Field label="Porte" value={contato.porte} />
                  </>
                )}
                <Field label="Status" value={statusLabel} />
                <Field label="Origem" value={origemLabel} />
              </div>

              {contato.observacoes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Observações</label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{contato.observacoes}</p>
                </div>
              )}

              {/* Pessoas vinculadas (para empresas) */}
              {!isPessoa && contato.pessoas && contato.pessoas.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
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
            </>
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
      </div>
    </div>
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
