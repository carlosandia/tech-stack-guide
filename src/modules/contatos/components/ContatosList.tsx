/**
 * AIDEV-NOTE: Tabela de listagem de contatos com checkbox
 * Conforme PRD-06 e Design System - Table px-4 py-3
 * Colunas renderizadas dinamicamente com base no ContatoColumnsToggle
 * Colunas Empresa, Segmentação e Responsável são clicáveis com popovers inline
 */

import { useState, useRef, useEffect, useCallback, forwardRef, memo } from 'react'
import { detectCountryByPhone } from '@/shared/utils/countries'
import { createPortal } from 'react-dom'
import { Eye, Pencil, Trash2, MoreHorizontal, Users2, Plus } from 'lucide-react'
import { SegmentoBadge } from './SegmentoBadge'
import { InlineEmpresaPopover } from './InlineEmpresaPopover'
import { InlineSegmentoPopover } from './InlineSegmentoPopover'
import { InlineResponsavelPopover } from './InlineResponsavelPopover'
import { InlinePessoaPopover } from './InlinePessoaPopover'
import type { Contato, TipoContato } from '../services/contatos.api'
import type { ColumnConfig } from './ContatoColumnsToggle'
import { StatusContatoOptions } from '../schemas/contatos.schema'
import { useOrigensAtivas, getOrigemLabel } from '@/modules/configuracoes/hooks/useOrigens'
import { format } from 'date-fns'

// Mapeamento de coluna UI → coluna DB para ordenação
const COLUMN_DB_MAP: Record<string, string> = {
  nome: 'nome',
  nome_empresa: 'nome_fantasia',
  email: 'email',
  telefone: 'telefone',
  cargo: 'cargo',
  status: 'status',
  origem: 'origem',
  criado_em: 'criado_em',
  razao_social: 'razao_social',
  cnpj: 'cnpj',
  segmento_mercado: 'segmento',
  porte: 'porte',
  website: 'website',
}

interface ContatosListProps {
  contatos: Contato[]
  tipo: TipoContato
  loading?: boolean
  selectedIds: Set<string>
  columns: ColumnConfig[]
  sortConfig?: { column: string; direction: 'asc' | 'desc' } | null
  onSort?: (dbColumn: string) => void
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onView: (contato: Contato) => void
  onEdit: (contato: Contato) => void
  onDelete: (contato: Contato) => void
  onCriarOportunidade?: (contato: Contato) => void
}

export const ContatosList = forwardRef<HTMLDivElement, ContatosListProps>(function ContatosList({
  contatos,
  tipo,
  loading,
  selectedIds,
  columns,
  sortConfig,
  onSort,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
  onCriarOportunidade,
}, _ref) {
  const allSelected = contatos.length > 0 && contatos.every((c) => selectedIds.has(c.id))
  const isPessoa = tipo === 'pessoa'

  // Colunas visíveis (excluindo ações, que é tratado separadamente)
  const visibleColumns = columns.filter(c => c.visible && c.key !== 'acoes')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando contatos...</div>
      </div>
    )
  }

  if (contatos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
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
    <div className="flex-1 overflow-auto relative">
      <table className="w-full border-collapse" style={{ minWidth: visibleColumns.length > 5 ? `${visibleColumns.length * 160 + 100}px` : undefined }}>
        <thead className="sticky top-0 z-20 bg-background">
          <tr className="border-b border-border">
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded border-input"
              />
            </th>
            {visibleColumns.map(col => {
              const dbCol = COLUMN_DB_MAP[col.key]
              const sortable = !!dbCol
              const isActive = sortConfig?.column === dbCol

              return (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap ${
                    sortable ? 'cursor-pointer hover:text-foreground select-none' : ''
                  }`}
                  onClick={sortable && onSort ? () => onSort(dbCol) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortable && isActive && (
                      <span className="text-xs text-primary font-bold">
                        {sortConfig?.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              )
            })}
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {contatos.map((contato) => (
            <ContatoRow
              key={contato.id}
              contato={contato}
              tipo={tipo}
              selected={selectedIds.has(contato.id)}
              visibleColumns={visibleColumns}
              onToggleSelect={() => onToggleSelect(contato.id)}
              onView={() => onView(contato)}
              onEdit={() => onEdit(contato)}
              onDelete={() => onDelete(contato)}
              onCriarOportunidade={onCriarOportunidade ? () => onCriarOportunidade(contato) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
})
ContatosList.displayName = 'ContatosList'

// ===== Cell Renderers =====

const CellNomePessoa = memo(forwardRef<HTMLDivElement, { contato: Contato; onCriarOportunidade?: () => void }>(function CellNomePessoa({ contato, onCriarOportunidade }, _ref) {
  const semOportunidade = contato.total_oportunidades === 0
  return (
    <div className="min-w-0 flex items-center gap-2">
      <p className="text-sm font-medium text-foreground truncate">
        {contato.nome} {contato.sobrenome || ''}
      </p>
      {semOportunidade && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
            Sem oportunidade
          </span>
          {onCriarOportunidade && (
            <button
              onClick={(e) => { e.stopPropagation(); onCriarOportunidade() }}
              className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors"
              title="Criar oportunidade"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}))
CellNomePessoa.displayName = 'CellNomePessoa'

const CellNomeEmpresa = memo(function CellNomeEmpresa({ contato }: { contato: Contato }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground truncate">
        {contato.nome_fantasia || contato.razao_social}
      </p>
      {contato.nome_fantasia && contato.razao_social && (
        <p className="text-xs text-muted-foreground truncate">{contato.razao_social}</p>
      )}
    </div>
  )
})

const CellEmpresaVinculada = memo(forwardRef<HTMLDivElement, { contato: Contato }>(function CellEmpresaVinculada({ contato }, _ref) {
  return (
    <InlineEmpresaPopover contatoId={contato.id} empresaAtual={contato.empresa}>
      <span className="text-sm text-foreground truncate block max-w-[150px] border-b border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
        {contato.empresa?.nome_fantasia || contato.empresa?.razao_social || '—'}
      </span>
    </InlineEmpresaPopover>
  )
}))
CellEmpresaVinculada.displayName = 'CellEmpresaVinculada'

const CellSegmentacao = memo(function CellSegmentacao({ contato }: { contato: Contato }) {
  return (
    <InlineSegmentoPopover contatoId={contato.id} segmentosAtuais={contato.segmentos}>
      <div className="flex items-center gap-1.5 min-w-[120px] max-w-[260px] border-b border-dashed border-transparent hover:border-primary transition-colors">
        {contato.segmentos && contato.segmentos.length > 0
          ? (
            <>
              <SegmentoBadge key={contato.segmentos[0].id} nome={contato.segmentos[0].nome} cor={contato.segmentos[0].cor} />
              {contato.segmentos.length > 1 && (
                <span className="text-xs text-muted-foreground">+{contato.segmentos.length - 1}</span>
              )}
            </>
          )
          : <span className="text-sm text-muted-foreground/50">—</span>}
      </div>
    </InlineSegmentoPopover>
  )
})

const CellResponsavel = memo(function CellResponsavel({ contato }: { contato: Contato }) {
  return (
    <InlineResponsavelPopover contatoId={contato.id} ownerId={contato.owner_id}>
      <span className="text-sm text-foreground truncate block max-w-[120px] border-b border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
        {contato.owner ? `${contato.owner.nome}` : '—'}
      </span>
    </InlineResponsavelPopover>
  )
})

const CellPessoaVinculada = memo(function CellPessoaVinculada({ contato }: { contato: Contato }) {
  const pessoas = contato.pessoas || []
  const firstName = pessoas.length > 0
    ? (pessoas[0].nome || '').toLowerCase()
    : null

  return (
    <InlinePessoaPopover empresaId={contato.id} pessoasVinculadas={contato.pessoas}>
      <div className="flex items-center gap-1 border-b border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
        <Users2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm text-foreground">
          {pessoas.length === 0
            ? '—'
            : pessoas.length === 1
              ? firstName
              : `${firstName} (+${pessoas.length - 1})`}
        </span>
      </div>
    </InlinePessoaPopover>
  )
})

const CellStatus = memo(function CellStatus({ contato }: { contato: Contato }) {
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
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[contato.status] || 'bg-muted text-muted-foreground'}`}>
      {statusLabel}
    </span>
  )
})

const CellSimpleText = memo(forwardRef<HTMLSpanElement, { value: string | null | undefined }>(function CellSimpleText({ value }, ref) {
  return <span ref={ref} className="text-sm text-foreground truncate block max-w-[200px]">{value || '—'}</span>
}))
CellSimpleText.displayName = 'CellSimpleText'

const CellTelefone = memo(function CellTelefone({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>
  const country = detectCountryByPhone(value)
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground truncate max-w-[200px]">
      <span className="text-base leading-none shrink-0">{country?.flag ?? '🌐'}</span>
      <span className="truncate">{value}</span>
    </span>
  )
})

const CellOrigem = memo(function CellOrigem({ contato }: { contato: Contato }) {
  const { data: origens } = useOrigensAtivas()
  const label = getOrigemLabel(origens, contato.origem)
  return <span className="text-sm text-foreground">{label}</span>
})

const CellCriadoEm = memo(function CellCriadoEm({ contato }: { contato: Contato }) {
  try {
    return <span className="text-sm text-foreground whitespace-nowrap">{format(new Date(contato.criado_em), 'dd/MM/yyyy')}</span>
  } catch {
    return <span className="text-sm text-muted-foreground">—</span>
  }
})

// Decide which cell to render based on column key and tipo
function renderCell(col: ColumnConfig, contato: Contato, _tipo: TipoContato, stopPropagation: boolean, onCriarOportunidade?: () => void) {
  const wrapStop = (el: React.ReactNode) =>
    stopPropagation ? <td key={col.key} className="px-4 py-3" onClick={e => e.stopPropagation()}>{el}</td> : <td key={col.key} className="px-4 py-3">{el}</td>

  switch (col.key) {
    // Pessoa fixed
    case 'nome':
      return <td key={col.key} className="px-4 py-3"><CellNomePessoa contato={contato} onCriarOportunidade={onCriarOportunidade} /></td>
    case 'empresa':
      return wrapStop(<CellEmpresaVinculada contato={contato} />)
    case 'segmentacao':
      return wrapStop(<CellSegmentacao contato={contato} />)
    case 'responsavel':
      return wrapStop(<CellResponsavel contato={contato} />)
    case 'status':
      return <td key={col.key} className="px-4 py-3"><CellStatus contato={contato} /></td>

    // Empresa fixed
    case 'nome_empresa':
      return <td key={col.key} className="px-4 py-3"><CellNomeEmpresa contato={contato} /></td>
    case 'pessoa_vinculada':
      return wrapStop(<CellPessoaVinculada contato={contato} />)

    // System - Pessoa
    case 'email':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.email} /></td>
    case 'telefone':
      return <td key={col.key} className="px-4 py-3"><CellTelefone value={contato.telefone} /></td>
    case 'cargo':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.cargo} /></td>
    case 'linkedin':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.linkedin_url} /></td>
    case 'origem':
      return <td key={col.key} className="px-4 py-3"><CellOrigem contato={contato} /></td>
    case 'criado_em':
      return <td key={col.key} className="px-4 py-3"><CellCriadoEm contato={contato} /></td>

    // System - Empresa
    case 'razao_social':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.razao_social} /></td>
    case 'cnpj':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.cnpj} /></td>
    case 'segmento_mercado':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.segmento} /></td>
    case 'porte':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.porte} /></td>
    case 'website':
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value={contato.website} /></td>

    // Custom fields
    default:
      if (col.key.startsWith('custom_')) {
        let customValue = (contato as any)?.campos_customizados?.[col.key.replace('custom_', '')] ?? null
        // Multi-select: converter pipe para vírgula para exibição
        if (typeof customValue === 'string' && customValue.includes('|')) {
          customValue = customValue.split('|').map((s: string) => s.trim()).filter(Boolean).join(', ')
        }
        return <td key={col.key} className="px-4 py-3"><CellSimpleText value={customValue} /></td>
      }
      return <td key={col.key} className="px-4 py-3"><CellSimpleText value="—" /></td>
  }
}

// Columns that need stopPropagation (editable inline)
const INTERACTIVE_KEYS = new Set(['empresa', 'segmentacao', 'responsavel', 'pessoa_vinculada'])

const ContatoRow = forwardRef<HTMLTableRowElement, {
  contato: Contato
  tipo: TipoContato
  selected: boolean
  visibleColumns: ColumnConfig[]
  onToggleSelect: () => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onCriarOportunidade?: () => void
}>(function ContatoRow({
  contato,
  tipo,
  selected,
  visibleColumns,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onCriarOportunidade,
}, _ref) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updateMenuPosition = useCallback(() => {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 })
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    updateMenuPosition()

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    function handleScroll() { updateMenuPosition() }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [menuOpen, updateMenuPosition])

  return (
    <tr
      className={`hover:bg-accent/50 cursor-pointer transition-colors ${selected ? 'bg-primary/5' : ''}`}
      onClick={onView}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect} className="rounded border-input" />
      </td>

      {visibleColumns.map(col => renderCell(col, contato, tipo, INTERACTIVE_KEYS.has(col.key), onCriarOportunidade))}

      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          ref={menuBtnRef}
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
        {menuOpen && createPortal(
          <div
            ref={menuRef}
            className="fixed w-36 bg-background rounded-md shadow-md border border-border py-1"
            style={{ top: menuPos.top, left: menuPos.left, zIndex: 600 }}
          >
            <button onClick={() => { onView(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent">
              <Eye className="w-3.5 h-3.5" /> Visualizar
            </button>
            <button onClick={() => { onEdit(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </div>,
          document.body
        )}
      </td>
    </tr>
  )
})
ContatoRow.displayName = 'ContatoRow'
