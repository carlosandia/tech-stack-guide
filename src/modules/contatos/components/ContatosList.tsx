/**
 * AIDEV-NOTE: Tabela de listagem de contatos com checkbox
 * Conforme PRD-06 e Design System - Table px-4 py-3
 * Colunas Empresa, Segmentação e Responsável são clicáveis com popovers inline
 */

import { Eye, Pencil, Trash2, MoreHorizontal, Users2 } from 'lucide-react'
import { SegmentoBadge } from './SegmentoBadge'
import { InlineEmpresaPopover } from './InlineEmpresaPopover'
import { InlineSegmentoPopover } from './InlineSegmentoPopover'
import { InlineResponsavelPopover } from './InlineResponsavelPopover'
import { InlinePessoaPopover } from './InlinePessoaPopover'
import type { Contato, TipoContato } from '../services/contatos.api'
import { StatusContatoOptions } from '../schemas/contatos.schema'
import { useState } from 'react'

interface ContatosListProps {
  contatos: Contato[]
  tipo: TipoContato
  loading?: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onView: (contato: Contato) => void
  onEdit: (contato: Contato) => void
  onDelete: (contato: Contato) => void
}

export function ContatosList({
  contatos,
  tipo,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
}: ContatosListProps) {
  const allSelected = contatos.length > 0 && contatos.every((c) => selectedIds.has(c.id))
  const isPessoa = tipo === 'pessoa'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando contatos...</div>
      </div>
    )
  }

  if (contatos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-2xl text-muted-foreground/50">👤</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhum{isPessoa ? 'a pessoa' : 'a empresa'} encontrad{isPessoa ? 'a' : 'a'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em "+ Nov{isPessoa ? 'a Pessoa' : 'a Empresa'}" para começar
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded border-input"
              />
            </th>
            {isPessoa ? (
              <>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">Empresa</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">Segmentação</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Responsável</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </>
            ) : (
              <>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Empresa</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">CNPJ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">Pessoas</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">Segmentação</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Responsável</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </>
            )}
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {contatos.map((contato) => (
            <ContatoRow
              key={contato.id}
              contato={contato}
              tipo={tipo}
              selected={selectedIds.has(contato.id)}
              onToggleSelect={() => onToggleSelect(contato.id)}
              onView={() => onView(contato)}
              onEdit={() => onEdit(contato)}
              onDelete={() => onDelete(contato)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ContatoRow({
  contato,
  tipo,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
}: {
  contato: Contato
  tipo: TipoContato
  selected: boolean
  onToggleSelect: () => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isPessoa = tipo === 'pessoa'
  const statusLabel = StatusContatoOptions.find(s => s.value === contato.status)?.label || contato.status

  const statusColor: Record<string, string> = {
    novo: 'bg-blue-100 text-blue-700',
    lead: 'bg-amber-100 text-amber-700',
    mql: 'bg-purple-100 text-purple-700',
    sql: 'bg-indigo-100 text-indigo-700',
    cliente: 'bg-green-100 text-green-700',
    perdido: 'bg-red-100 text-red-700',
  }

  return (
    <tr
      className={`border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors ${selected ? 'bg-primary/5' : ''}`}
      onClick={onView}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect} className="rounded border-input" />
      </td>

      {isPessoa ? (
        <>
          <td className="px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {contato.nome} {contato.sobrenome || ''}
              </p>
              <p className="text-xs text-muted-foreground truncate md:hidden">{contato.email}</p>
            </div>
          </td>
          <td className="px-4 py-3 hidden md:table-cell">
            <span className="text-sm text-foreground truncate block max-w-[200px]">{contato.email || '—'}</span>
          </td>

          {/* Empresa — clicável com popover */}
          <td className="px-4 py-3 hidden lg:table-cell" onClick={e => e.stopPropagation()}>
            <InlineEmpresaPopover
              contatoId={contato.id}
              empresaAtual={contato.empresa}
            >
              <span className="text-sm text-foreground truncate block max-w-[150px] border-b border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
                {contato.empresa?.nome_fantasia || contato.empresa?.razao_social || '—'}
              </span>
            </InlineEmpresaPopover>
          </td>

          {/* Segmentação — clicável com popover */}
          <td className="px-4 py-3 hidden lg:table-cell" onClick={e => e.stopPropagation()}>
            <InlineSegmentoPopover
              contatoId={contato.id}
              segmentosAtuais={contato.segmentos}
            >
              <div className="flex flex-wrap gap-1 max-w-[200px] border-b border-dashed border-transparent hover:border-primary transition-colors">
                {contato.segmentos && contato.segmentos.length > 0
                  ? contato.segmentos.slice(0, 2).map((s) => <SegmentoBadge key={s.id} nome={s.nome} cor={s.cor} />)
                  : <span className="text-sm text-muted-foreground/50">—</span>}
                {contato.segmentos && contato.segmentos.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{contato.segmentos.length - 2}</span>
                )}
              </div>
            </InlineSegmentoPopover>
          </td>

          {/* Responsável — clicável com popover */}
          <td className="px-4 py-3 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
            <InlineResponsavelPopover
              contatoId={contato.id}
              ownerId={contato.owner_id}
            >
              <span className="text-sm text-foreground truncate block max-w-[120px] border-b border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
                {contato.owner ? `${contato.owner.nome}` : '—'}
              </span>
            </InlineResponsavelPopover>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {contato.nome_fantasia || contato.razao_social}
              </p>
              {contato.nome_fantasia && contato.razao_social && (
                <p className="text-xs text-muted-foreground truncate">{contato.razao_social}</p>
              )}
            </div>
          </td>
          <td className="px-4 py-3 hidden md:table-cell">
            <span className="text-sm text-foreground">{contato.cnpj || '—'}</span>
          </td>

          {/* Pessoas vinculadas — clicável com popover */}
          <td className="px-4 py-3 hidden lg:table-cell" onClick={e => e.stopPropagation()}>
            <InlinePessoaPopover
              empresaId={contato.id}
              pessoasVinculadas={contato.pessoas}
            >
              <div className="flex items-center gap-1 border-b border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
                <Users2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {contato.pessoas && contato.pessoas.length > 0
                    ? `${contato.pessoas.length} pessoa${contato.pessoas.length > 1 ? 's' : ''}`
                    : '—'}
                </span>
              </div>
            </InlinePessoaPopover>
          </td>

          {/* Segmentação — clicável com popover */}
          <td className="px-4 py-3 hidden lg:table-cell" onClick={e => e.stopPropagation()}>
            <InlineSegmentoPopover
              contatoId={contato.id}
              segmentosAtuais={contato.segmentos}
            >
              <div className="flex flex-wrap gap-1 max-w-[200px] border-b border-dashed border-transparent hover:border-primary transition-colors">
                {contato.segmentos && contato.segmentos.length > 0
                  ? contato.segmentos.slice(0, 2).map((s) => <SegmentoBadge key={s.id} nome={s.nome} cor={s.cor} />)
                  : <span className="text-sm text-muted-foreground/50">—</span>}
                {contato.segmentos && contato.segmentos.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{contato.segmentos.length - 2}</span>
                )}
              </div>
            </InlineSegmentoPopover>
          </td>

          {/* Responsável — clicável com popover */}
          <td className="px-4 py-3 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
            <InlineResponsavelPopover
              contatoId={contato.id}
              ownerId={contato.owner_id}
            >
              <span className="text-sm text-foreground truncate block max-w-[120px] border-b border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
                {contato.owner ? `${contato.owner.nome}` : '—'}
              </span>
            </InlineResponsavelPopover>
          </td>
        </>
      )}

      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[contato.status] || 'bg-muted text-muted-foreground'}`}>
          {statusLabel}
        </span>
      </td>

      <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-36 bg-background rounded-md shadow-md border border-border py-1 z-50">
              <button onClick={() => { onView(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent">
                <Eye className="w-3.5 h-3.5" /> Visualizar
              </button>
              <button onClick={() => { onEdit(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  )
}
