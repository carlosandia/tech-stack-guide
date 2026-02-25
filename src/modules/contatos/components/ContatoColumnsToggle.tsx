/**
 * AIDEV-NOTE: Toggle de colunas para contatos
 * Conforme PRD-06 RF-005 - Popover com checkboxes
 * Integra campos do sistema + campos customizados de /configuracoes/campos
 * Colunas fixas não podem ser ocultadas
 */

import { useState, useRef, useEffect, useMemo, forwardRef } from 'react'
import { Settings2 } from 'lucide-react'
import type { TipoContato } from '../services/contatos.api'
import { useCamposConfig } from '../hooks/useCamposConfig'

export interface ColumnConfig {
  key: string
  label: string
  fixed: boolean
  visible: boolean
  group: 'fixed' | 'system' | 'custom'
}

const COLUNAS_FIXAS_PESSOA: ColumnConfig[] = [
  { key: 'nome', label: 'Nome', fixed: true, visible: true, group: 'fixed' },
  { key: 'empresa', label: 'Empresa Vinculada', fixed: true, visible: true, group: 'fixed' },
  { key: 'segmentacao', label: 'Segmentação', fixed: true, visible: true, group: 'fixed' },
  { key: 'responsavel', label: 'Atribuído A', fixed: true, visible: true, group: 'fixed' },
  { key: 'status', label: 'Status', fixed: true, visible: true, group: 'fixed' },
  { key: 'acoes', label: 'Ações', fixed: true, visible: true, group: 'fixed' },
]

const COLUNAS_SISTEMA_PESSOA: ColumnConfig[] = [
  { key: 'email', label: 'Email', fixed: false, visible: true, group: 'system' },
  { key: 'telefone', label: 'Telefone', fixed: false, visible: false, group: 'system' },
  { key: 'cargo', label: 'Cargo', fixed: false, visible: false, group: 'system' },
  { key: 'origem', label: 'Origem', fixed: false, visible: false, group: 'system' },
  { key: 'criado_em', label: 'Data de Criação', fixed: false, visible: false, group: 'system' },
]

const COLUNAS_FIXAS_EMPRESA: ColumnConfig[] = [
  { key: 'nome_empresa', label: 'Nome da Empresa', fixed: true, visible: true, group: 'fixed' },
  { key: 'pessoa_vinculada', label: 'Pessoa Vinculada', fixed: true, visible: true, group: 'fixed' },
  { key: 'status', label: 'Status', fixed: true, visible: true, group: 'fixed' },
  { key: 'acoes', label: 'Ações', fixed: true, visible: true, group: 'fixed' },
]

const COLUNAS_SISTEMA_EMPRESA: ColumnConfig[] = [
  { key: 'razao_social', label: 'Razão Social', fixed: false, visible: false, group: 'system' },
  { key: 'cnpj', label: 'CNPJ', fixed: false, visible: false, group: 'system' },
  { key: 'segmento_mercado', label: 'Segmento de Mercado', fixed: false, visible: false, group: 'system' },
  { key: 'porte', label: 'Porte', fixed: false, visible: false, group: 'system' },
  { key: 'website', label: 'Website', fixed: false, visible: false, group: 'system' },
  { key: 'email', label: 'Email', fixed: false, visible: false, group: 'system' },
  { key: 'telefone', label: 'Telefone', fixed: false, visible: false, group: 'system' },
]

const STORAGE_KEY_PREFIX = 'contatos_columns_v2_'

function getDefaultColumns(tipo: TipoContato): ColumnConfig[] {
  const fixas = tipo === 'pessoa' ? COLUNAS_FIXAS_PESSOA : COLUNAS_FIXAS_EMPRESA
  const sistema = tipo === 'pessoa' ? COLUNAS_SISTEMA_PESSOA : COLUNAS_SISTEMA_EMPRESA
  return [...fixas, ...sistema]
}

function getInitialColumns(tipo: TipoContato): ColumnConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + tipo)
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnConfig[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Garantir que colunas fixas sempre estejam presentes e visíveis
        const defaults = getDefaultColumns(tipo)
        const savedKeys = new Set(parsed.map(c => c.key))
        // Adicionar colunas padrão que não existem no salvo (novos campos adicionados)
        const missing = defaults.filter(d => !savedKeys.has(d.key))
        const merged = [...parsed, ...missing].map(c => {
          // Forçar fixas como visíveis
          const defaultCol = defaults.find(d => d.key === c.key)
          if (defaultCol?.fixed) {
            return { ...c, fixed: true, visible: true, group: 'fixed' as const }
          }
          return c
        })
        return merged
      }
    }
  } catch {
    // Fallback para defaults
  }
  return getDefaultColumns(tipo)
}

interface ContatoColumnsToggleProps {
  tipo: TipoContato
  columns: ColumnConfig[]
  onChange: (columns: ColumnConfig[]) => void
  onSave?: (columns: ColumnConfig[]) => void
  isSaving?: boolean
}

export const ContatoColumnsToggle = forwardRef<HTMLDivElement, ContatoColumnsToggleProps>(function ContatoColumnsToggle({ tipo, columns, onChange, onSave, isSaving }, _ref) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Buscar configuração global de campos
  const { campos, getColumnLabel } = useCamposConfig(tipo)
  const camposCustomizados = campos.filter(c => !c.sistema && c.ativo)

  // Sincronizar labels das colunas do sistema quando a config global carrega
  const labelsSyncedRef = useRef(false)
  useEffect(() => {
    if (labelsSyncedRef.current || campos.length === 0) return
    labelsSyncedRef.current = true
    let hasChanges = false
    const updated = columns.map(col => {
      if (col.group === 'system') {
        const label = getColumnLabel(col.key, '')
        if (label && label !== col.label) { hasChanges = true; return { ...col, label } }
      }
      return col
    })
    if (hasChanges) {
      onChange(updated)
      localStorage.setItem(STORAGE_KEY_PREFIX + tipo, JSON.stringify(updated))
    }
  }, [campos])

  // Merge columns with custom fields + update system labels
  const mergedColumns = useMemo(() => {
    const existingKeys = new Set(columns.map(c => c.key))
    const customColumns: ColumnConfig[] = camposCustomizados
      .filter(c => !existingKeys.has(`custom_${c.slug}`))
      .map(c => ({
        key: `custom_${c.slug}`,
        label: c.nome,
        fixed: false,
        visible: false,
        group: 'custom' as const,
      }))

    // Atualizar labels das colunas do sistema com a config global
    const merged = [...columns, ...customColumns].map(col => {
      if (col.group === 'system') {
        const label = getColumnLabel(col.key, '')
        if (label) return { ...col, label }
      }
      return col
    })
    return merged
  }, [columns, camposCustomizados, getColumnLabel])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const toggleColumn = (key: string) => {
    const updated = mergedColumns.map(c =>
      c.key === key && !c.fixed ? { ...c, visible: !c.visible } : c
    )
    onChange(updated)
    localStorage.setItem(STORAGE_KEY_PREFIX + tipo, JSON.stringify(updated))
  }

  const handleRestore = () => {
    const defaults = getDefaultColumns(tipo)
    // Add back custom fields as hidden
    const customCols: ColumnConfig[] = camposCustomizados.map(c => ({
      key: `custom_${c.slug}`,
      label: c.nome,
      fixed: false,
      visible: false,
      group: 'custom' as const,
    }))
    const restored = [...defaults, ...customCols]
    onChange(restored)
    localStorage.removeItem(STORAGE_KEY_PREFIX + tipo)
  }

  const fixedCols = mergedColumns.filter(c => c.group === 'fixed')
  const systemCols = mergedColumns.filter(c => c.group === 'system')
  const customCols = mergedColumns.filter(c => c.group === 'custom')

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
          open
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Colunas</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-background rounded-lg shadow-lg border border-border py-2 z-[500] max-h-[70vh] overflow-y-auto">
          <div className="px-3 pb-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">Colunas Visíveis</p>
          </div>

          {/* Colunas Fixas */}
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

          {/* Campos do Sistema (globais) */}
          <div className="px-3 pt-2 pb-1 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Campos do Sistema</p>
            {systemCols.map(c => (
              <label key={c.key} className="flex items-center gap-2 py-1 text-sm text-foreground cursor-pointer hover:text-primary">
                <input type="checkbox" checked={c.visible} onChange={() => toggleColumn(c.key)} className="rounded border-input" />
                <span>{c.label}</span>
              </label>
            ))}
          </div>

          {/* Campos Personalizados */}
          {customCols.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Campos Personalizados</p>
              {customCols.map(c => (
                <label key={c.key} className="flex items-center gap-2 py-1 text-sm text-foreground cursor-pointer hover:text-primary">
                  <input type="checkbox" checked={c.visible} onChange={() => toggleColumn(c.key)} className="rounded border-input" />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="px-3 pt-2 border-t border-border space-y-1">
            {onSave && (
              <button
                onClick={() => onSave(mergedColumns)}
                disabled={isSaving}
                className="w-full text-sm font-medium text-primary hover:underline py-1 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Colunas'}
              </button>
            )}
            <button
              onClick={handleRestore}
              className="w-full text-sm text-muted-foreground hover:text-foreground hover:underline py-1"
            >
              Restaurar Padrão
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
ContatoColumnsToggle.displayName = 'ContatoColumnsToggle'

export { getInitialColumns, getDefaultColumns }
