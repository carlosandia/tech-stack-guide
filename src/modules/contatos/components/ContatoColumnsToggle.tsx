/**
 * AIDEV-NOTE: Toggle de colunas para contatos
 * Conforme PRD-06 RF-005 - Popover com checkboxes
 * Colunas fixas não podem ser ocultadas
 */

import { useState, useRef, useEffect } from 'react'
import { Settings2 } from 'lucide-react'
import type { TipoContato } from '../services/contatos.api'

export interface ColumnConfig {
  key: string
  label: string
  fixed: boolean
  visible: boolean
}

const COLUNAS_FIXAS_PESSOA: ColumnConfig[] = [
  { key: 'nome', label: 'Nome', fixed: true, visible: true },
  { key: 'empresa', label: 'Empresa Vinculada', fixed: true, visible: true },
  { key: 'segmentacao', label: 'Segmentação', fixed: true, visible: true },
  { key: 'responsavel', label: 'Atribuído A', fixed: true, visible: true },
  { key: 'status', label: 'Status', fixed: true, visible: true },
  { key: 'acoes', label: 'Ações', fixed: true, visible: true },
]

const COLUNAS_DINAMICAS_PESSOA: ColumnConfig[] = [
  { key: 'email', label: 'Email', fixed: false, visible: true },
  { key: 'telefone', label: 'Telefone', fixed: false, visible: false },
  { key: 'cargo', label: 'Cargo', fixed: false, visible: false },
  { key: 'linkedin', label: 'LinkedIn', fixed: false, visible: false },
  { key: 'origem', label: 'Origem', fixed: false, visible: false },
  { key: 'criado_em', label: 'Data de Criação', fixed: false, visible: false },
]

const COLUNAS_FIXAS_EMPRESA: ColumnConfig[] = [
  { key: 'nome_empresa', label: 'Nome da Empresa', fixed: true, visible: true },
  { key: 'pessoa_vinculada', label: 'Pessoa Vinculada', fixed: true, visible: true },
  { key: 'status', label: 'Status', fixed: true, visible: true },
  { key: 'acoes', label: 'Ações', fixed: true, visible: true },
]

const COLUNAS_DINAMICAS_EMPRESA: ColumnConfig[] = [
  { key: 'razao_social', label: 'Razão Social', fixed: false, visible: false },
  { key: 'cnpj', label: 'CNPJ', fixed: false, visible: false },
  { key: 'segmento_mercado', label: 'Segmento de Mercado', fixed: false, visible: false },
  { key: 'porte', label: 'Porte', fixed: false, visible: false },
  { key: 'website', label: 'Website', fixed: false, visible: false },
  { key: 'email', label: 'Email', fixed: false, visible: false },
  { key: 'telefone', label: 'Telefone', fixed: false, visible: false },
]

const STORAGE_KEY_PREFIX = 'contatos_columns_'

function getInitialColumns(tipo: TipoContato): ColumnConfig[] {
  const key = STORAGE_KEY_PREFIX + tipo
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // fallthrough
    }
  }
  const fixas = tipo === 'pessoa' ? COLUNAS_FIXAS_PESSOA : COLUNAS_FIXAS_EMPRESA
  const dinamicas = tipo === 'pessoa' ? COLUNAS_DINAMICAS_PESSOA : COLUNAS_DINAMICAS_EMPRESA
  return [...fixas, ...dinamicas]
}

function getDefaultColumns(tipo: TipoContato): ColumnConfig[] {
  const fixas = tipo === 'pessoa' ? COLUNAS_FIXAS_PESSOA : COLUNAS_FIXAS_EMPRESA
  const dinamicas = tipo === 'pessoa' ? COLUNAS_DINAMICAS_PESSOA : COLUNAS_DINAMICAS_EMPRESA
  return [...fixas, ...dinamicas]
}

interface ContatoColumnsToggleProps {
  tipo: TipoContato
  columns: ColumnConfig[]
  onChange: (columns: ColumnConfig[]) => void
}

export function ContatoColumnsToggle({ tipo, columns, onChange }: ContatoColumnsToggleProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const toggleColumn = (key: string) => {
    const updated = columns.map(c =>
      c.key === key && !c.fixed ? { ...c, visible: !c.visible } : c
    )
    onChange(updated)
    localStorage.setItem(STORAGE_KEY_PREFIX + tipo, JSON.stringify(updated))
  }

  const handleRestore = () => {
    const defaults = getDefaultColumns(tipo)
    onChange(defaults)
    localStorage.removeItem(STORAGE_KEY_PREFIX + tipo)
  }

  const fixedCols = columns.filter(c => c.fixed)
  const dynamicCols = columns.filter(c => !c.fixed)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-colors ${
          open
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        <Settings2 className="w-4 h-4" />
        <span className="hidden sm:inline">Colunas</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-background rounded-lg shadow-lg border border-border py-2 z-50">
          <div className="px-3 pb-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">Colunas Visíveis</p>
          </div>

          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Colunas Fixas</p>
            {fixedCols.map(c => (
              <label key={c.key} className="flex items-center gap-2 py-1 text-sm text-muted-foreground cursor-not-allowed">
                <input type="checkbox" checked disabled className="rounded border-input opacity-50" />
                <span>{c.label}</span>
                <span className="text-xs text-muted-foreground/50 ml-auto">(bloqueado)</span>
              </label>
            ))}
          </div>

          <div className="px-3 pt-2 pb-1 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Campos Globais</p>
            {dynamicCols.map(c => (
              <label key={c.key} className="flex items-center gap-2 py-1 text-sm text-foreground cursor-pointer hover:text-primary">
                <input type="checkbox" checked={c.visible} onChange={() => toggleColumn(c.key)} className="rounded border-input" />
                <span>{c.label}</span>
              </label>
            ))}
          </div>

          <div className="px-3 pt-2 border-t border-border">
            <button
              onClick={handleRestore}
              className="w-full text-sm text-primary hover:underline py-1"
            >
              Restaurar Padrão
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { getInitialColumns, getDefaultColumns }
