/**
 * AIDEV-NOTE: Bloco 1 - Campos da Oportunidade + Contato (RF-14.2)
 * Campos editáveis inline com seções Oportunidade e Contato
 * Engrenagem para show/hide campos (RF-14.2 + RF-15.6)
 * Empresa vinculada editável (vincular/desvincular/trocar)
 * MRR editável (recorrente + período)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { DollarSign, User, Calendar, Mail, Phone, Settings2, Check, Building2, RefreshCw, Link2, X, Search, Loader2, ChevronDown } from 'lucide-react'
import type { Oportunidade } from '../../services/negocios.api'
import { negociosApi } from '../../services/negocios.api'
import { useAtualizarOportunidade, useAtualizarContato } from '../../hooks/useOportunidadeDetalhes'
import { toast } from 'sonner'

interface DetalhesCamposProps {
  oportunidade: Oportunidade
  membros: Array<{ id: string; nome: string; sobrenome?: string | null }>
}

// Campos disponíveis com suas configurações
const CAMPOS_OPORTUNIDADE = [
  { id: 'valor', label: 'Valor', icon: DollarSign },
  { id: 'responsavel', label: 'Responsável', icon: User },
  { id: 'previsao', label: 'Previsão de fechamento', icon: Calendar },
]

const CAMPOS_CONTATO = [
  { id: 'contato_nome', label: 'Nome', icon: User },
  { id: 'contato_email', label: 'E-mail', icon: Mail },
  { id: 'contato_telefone', label: 'Telefone', icon: Phone },
  { id: 'contato_empresa', label: 'Empresa', icon: Building2 },
]

const STORAGE_KEY_CAMPOS = 'negocios_campos_visiveis'

function getCamposVisiveis(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CAMPOS)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

function getContatoNome(op: Oportunidade): string {
  if (!op.contato) return '—'
  if (op.contato.tipo === 'empresa') {
    return op.contato.nome_fantasia || op.contato.razao_social || '—'
  }
  return [op.contato.nome, op.contato.sobrenome].filter(Boolean).join(' ') || '—'
}

const PERIODOS_MRR = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

export function DetalhesCampos({ oportunidade, membros }: DetalhesCamposProps) {
  const atualizarOp = useAtualizarOportunidade()
  const atualizarContato = useAtualizarContato()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [camposVisiveis, setCamposVisiveis] = useState<Record<string, boolean>>(getCamposVisiveis)
  const [showGear, setShowGear] = useState(false)
  const gearRef = useRef<HTMLDivElement>(null)

  // Empresa search state
  const [showEmpresaSearch, setShowEmpresaSearch] = useState(false)
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [resultadosEmpresa, setResultadosEmpresa] = useState<Array<{ id: string; nome_fantasia?: string | null; razao_social?: string | null }>>([])
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false)
  const empresaSearchRef = useRef<HTMLDivElement>(null)
  const debounceEmpresaRef = useRef<ReturnType<typeof setTimeout>>()

  // Click outside para fechar gear popover e empresa search
  useEffect(() => {
    if (!showGear && !showEmpresaSearch) return
    const handler = (e: MouseEvent) => {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) {
        setShowGear(false)
      }
      if (empresaSearchRef.current && !empresaSearchRef.current.contains(e.target as Node)) {
        setShowEmpresaSearch(false)
        setBuscaEmpresa('')
        setResultadosEmpresa([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showGear, showEmpresaSearch])

  const isCampoVisivel = (campoId: string): boolean => {
    if (Object.keys(camposVisiveis).length === 0) return true
    return camposVisiveis[campoId] !== false
  }

  const toggleCampo = (campoId: string) => {
    const novo = { ...camposVisiveis }
    if (Object.keys(novo).length === 0) {
      ;[...CAMPOS_OPORTUNIDADE, ...CAMPOS_CONTATO].forEach(c => {
        novo[c.id] = c.id !== campoId
      })
    } else {
      novo[campoId] = !isCampoVisivel(campoId)
    }
    setCamposVisiveis(novo)
    localStorage.setItem(STORAGE_KEY_CAMPOS, JSON.stringify(novo))
  }

  const handleSaveOp = useCallback(async (field: string, value: unknown) => {
    try {
      await atualizarOp.mutateAsync({
        id: oportunidade.id,
        payload: { [field]: value || null },
      })
      setEditingField(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }, [oportunidade.id, atualizarOp])

  const handleSaveContato = useCallback(async (field: string, value: unknown) => {
    if (!oportunidade.contato?.id) return
    try {
      await atualizarContato.mutateAsync({
        id: oportunidade.contato.id,
        payload: { [field]: value || null },
      })
      setEditingField(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }, [oportunidade.contato?.id, atualizarContato])

  const handleResponsavelChange = useCallback(async (userId: string) => {
    try {
      await atualizarOp.mutateAsync({
        id: oportunidade.id,
        payload: { usuario_responsavel_id: userId || null },
      })
    } catch {
      toast.error('Erro ao alterar responsável')
    }
  }, [oportunidade.id, atualizarOp])

  // MRR toggle
  const handleToggleMrr = useCallback(async () => {
    const novoRecorrente = !oportunidade.recorrente
    try {
      await atualizarOp.mutateAsync({
        id: oportunidade.id,
        payload: {
          recorrente: novoRecorrente,
          periodo_recorrencia: novoRecorrente ? (oportunidade.periodo_recorrencia || 'mensal') : null,
        },
      })
    } catch {
      toast.error('Erro ao alterar recorrência')
    }
  }, [oportunidade.id, oportunidade.recorrente, oportunidade.periodo_recorrencia, atualizarOp])

  // MRR period change
  const handlePeriodoChange = useCallback(async (periodo: string) => {
    try {
      await atualizarOp.mutateAsync({
        id: oportunidade.id,
        payload: { periodo_recorrencia: periodo },
      })
    } catch {
      toast.error('Erro ao alterar período')
    }
  }, [oportunidade.id, atualizarOp])

  // Empresa search
  const handleBuscaEmpresa = useCallback((value: string) => {
    setBuscaEmpresa(value)
    if (debounceEmpresaRef.current) clearTimeout(debounceEmpresaRef.current)
    if (value.length < 2) {
      setResultadosEmpresa([])
      return
    }
    setBuscandoEmpresa(true)
    debounceEmpresaRef.current = setTimeout(async () => {
      try {
        const results = await negociosApi.buscarContatosAutocomplete(value, 'empresa')
        setResultadosEmpresa(results.map(r => ({
          id: r.id,
          nome_fantasia: r.nome_fantasia,
          razao_social: r.razao_social,
        })))
      } catch {
        setResultadosEmpresa([])
      } finally {
        setBuscandoEmpresa(false)
      }
    }, 300)
  }, [])

  // Vincular empresa
  const handleVincularEmpresa = useCallback(async (empresaId: string) => {
    if (!oportunidade.contato?.id) return
    try {
      await atualizarContato.mutateAsync({
        id: oportunidade.contato.id,
        payload: { empresa_id: empresaId },
      })
      setShowEmpresaSearch(false)
      setBuscaEmpresa('')
      setResultadosEmpresa([])
      toast.success('Empresa vinculada')
    } catch {
      toast.error('Erro ao vincular empresa')
    }
  }, [oportunidade.contato?.id, atualizarContato])

  // Desvincular empresa
  const handleDesvincularEmpresa = useCallback(async () => {
    if (!oportunidade.contato?.id) return
    try {
      await atualizarContato.mutateAsync({
        id: oportunidade.contato.id,
        payload: { empresa_id: null },
      })
      toast.success('Empresa desvinculada')
    } catch {
      toast.error('Erro ao desvincular empresa')
    }
  }, [oportunidade.contato?.id, atualizarContato])

  return (
    <div className="space-y-4">
      {/* Seção Oportunidade */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Oportunidade
          </h3>
          {/* Engrenagem show/hide (RF-14.2) */}
          <div className="relative" ref={gearRef}>
            <button
              onClick={() => setShowGear(!showGear)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-all duration-200"
              title="Campos visíveis"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            {showGear && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-lg z-[60] animate-enter">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">Campos visíveis</span>
                </div>
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Oportunidade
                  </div>
                  {CAMPOS_OPORTUNIDADE.map(c => (
                    <GearCheckItem key={c.id} label={c.label} checked={isCampoVisivel(c.id)} onToggle={() => toggleCampo(c.id)} />
                  ))}
                  <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                    Contato
                  </div>
                  {CAMPOS_CONTATO.map(c => (
                    <GearCheckItem key={c.id} label={c.label} checked={isCampoVisivel(c.id)} onToggle={() => toggleCampo(c.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Valor */}
          {isCampoVisivel('valor') && (
            <div>
              <FieldRow
                icon={<DollarSign className="w-3.5 h-3.5" />}
                label="Valor"
                value={formatCurrency(oportunidade.valor)}
                placeholder="R$ 0,00"
                isEditing={editingField === 'valor'}
                onStartEdit={() => {
                  setEditingField('valor')
                  setEditValue(String(oportunidade.valor || ''))
                }}
                editValue={editValue}
                onEditChange={setEditValue}
                onSave={() => handleSaveOp('valor', editValue ? parseFloat(editValue) : null)}
                onCancel={() => setEditingField(null)}
              />
              {/* MRR editável */}
              <div className="ml-5.5 mt-1 flex items-center gap-1.5">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!oportunidade.recorrente}
                    onChange={handleToggleMrr}
                    className="w-3 h-3 rounded border-input text-primary focus:ring-ring/30"
                  />
                  <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                    <RefreshCw className="w-2.5 h-2.5" />
                    MRR
                  </span>
                </label>
                {oportunidade.recorrente && (
                  <div className="relative">
                    <select
                      value={oportunidade.periodo_recorrencia || 'mensal'}
                      onChange={(e) => handlePeriodoChange(e.target.value)}
                      className="h-5 pl-1 pr-4 text-[10px] font-semibold text-primary bg-primary/10 border-0 rounded focus:ring-0 appearance-none cursor-pointer"
                    >
                      {PERIODOS_MRR.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-primary pointer-events-none" />
                  </div>
                )}
                {!oportunidade.recorrente && oportunidade.valor && (
                  <span className="text-[10px] text-muted-foreground">Valor único</span>
                )}
              </div>
            </div>
          )}

          {/* Responsável */}
          {isCampoVisivel('responsavel') && (
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground mb-0.5">Responsável</p>
                <select
                  className="w-full text-sm bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:ring-0 p-0 pb-0.5 text-foreground transition-colors cursor-pointer"
                  value={oportunidade.usuario_responsavel_id || ''}
                  onChange={(e) => handleResponsavelChange(e.target.value)}
                >
                  <option value="">Sem responsável</option>
                  {membros.map(m => (
                    <option key={m.id} value={m.id}>
                      {[m.nome, m.sobrenome].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Previsão */}
          {isCampoVisivel('previsao') && (
            <FieldRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Previsão de fechamento"
              value={oportunidade.previsao_fechamento ? new Date(oportunidade.previsao_fechamento).toLocaleDateString('pt-BR') : ''}
              placeholder="Sem data"
              isEditing={editingField === 'previsao'}
              onStartEdit={() => {
                setEditingField('previsao')
                setEditValue(oportunidade.previsao_fechamento?.slice(0, 10) || '')
              }}
              editValue={editValue}
              onEditChange={setEditValue}
              onSave={() => handleSaveOp('previsao_fechamento', editValue || null)}
              onCancel={() => setEditingField(null)}
              inputType="date"
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Seção Contato */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {oportunidade.contato?.tipo === 'empresa' ? 'Empresa' : 'Contato'}
        </h3>
        <div className="space-y-3">
          {isCampoVisivel('contato_nome') && (
            <FieldRow
              icon={<User className="w-3.5 h-3.5" />}
              label="Nome"
              value={getContatoNome(oportunidade)}
              placeholder="—"
              isEditing={editingField === 'contato_nome'}
              onStartEdit={() => {
                setEditingField('contato_nome')
                setEditValue(oportunidade.contato?.nome || '')
              }}
              editValue={editValue}
              onEditChange={setEditValue}
              onSave={() => handleSaveContato('nome', editValue)}
              onCancel={() => setEditingField(null)}
            />
          )}

          {isCampoVisivel('contato_email') && (
            <FieldRow
              icon={<Mail className="w-3.5 h-3.5" />}
              label="E-mail"
              value={oportunidade.contato?.email || ''}
              placeholder="—"
              isEditing={editingField === 'contato_email'}
              onStartEdit={() => {
                setEditingField('contato_email')
                setEditValue(oportunidade.contato?.email || '')
              }}
              editValue={editValue}
              onEditChange={setEditValue}
              onSave={() => handleSaveContato('email', editValue)}
              onCancel={() => setEditingField(null)}
              inputType="email"
            />
          )}

          {isCampoVisivel('contato_telefone') && (
            <FieldRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label="Telefone"
              value={oportunidade.contato?.telefone || ''}
              placeholder="—"
              isEditing={editingField === 'contato_telefone'}
              onStartEdit={() => {
                setEditingField('contato_telefone')
                setEditValue(oportunidade.contato?.telefone || '')
              }}
              editValue={editValue}
              onEditChange={setEditValue}
              onSave={() => handleSaveContato('telefone', editValue)}
              onCancel={() => setEditingField(null)}
              inputType="tel"
            />
          )}

          {/* Empresa vinculada (editável: vincular/desvincular/trocar) */}
          {isCampoVisivel('contato_empresa') && oportunidade.contato?.tipo === 'pessoa' && (
            <div className="flex items-start gap-2" ref={empresaSearchRef}>
              <Building2 className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground mb-0.5">Empresa</p>

                {oportunidade.contato?.empresa ? (
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-foreground truncate flex-1">
                      {oportunidade.contato.empresa.nome_fantasia || oportunidade.contato.empresa.razao_social || '—'}
                    </p>
                    <button
                      onClick={() => setShowEmpresaSearch(true)}
                      className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                      title="Trocar empresa"
                    >
                      <Link2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleDesvincularEmpresa}
                      className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Desvincular empresa"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowEmpresaSearch(true)}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Link2 className="w-3 h-3" />
                    Vincular empresa
                  </button>
                )}

                {/* Search dropdown empresa */}
                {showEmpresaSearch && (
                  <div className="mt-1.5 relative">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={buscaEmpresa}
                        onChange={(e) => handleBuscaEmpresa(e.target.value)}
                        placeholder="Buscar empresa..."
                        className="w-full h-7 pl-6 pr-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring/30 placeholder:text-muted-foreground"
                        autoFocus
                      />
                      {buscandoEmpresa && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {resultadosEmpresa.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-0.5 bg-card border border-border rounded-md shadow-lg z-[60] max-h-[150px] overflow-y-auto">
                        {resultadosEmpresa.map(emp => (
                          <button
                            key={emp.id}
                            onClick={() => handleVincularEmpresa(emp.id)}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent transition-all duration-200 flex items-center gap-2"
                          >
                            <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{emp.nome_fantasia || emp.razao_social}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Sub-componente: Gear check item
// =====================================================

function GearCheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-all duration-200"
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
        checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
      }`}>
        {checked && <Check className="w-3 h-3" />}
      </div>
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </button>
  )
}

// =====================================================
// Sub-componente: Campo editável inline
// =====================================================

interface FieldRowProps {
  icon: React.ReactNode
  label: string
  value: string
  placeholder: string
  isEditing: boolean
  onStartEdit: () => void
  editValue: string
  onEditChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  inputType?: string
}

function FieldRow({
  icon, label, value, placeholder, isEditing,
  onStartEdit, editValue, onEditChange, onSave, onCancel, inputType = 'text',
}: FieldRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-1 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
        {isEditing ? (
          <input
            type={inputType}
            className="w-full text-sm bg-transparent border-0 border-b border-primary focus:ring-0 p-0 pb-0.5 text-foreground"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave()
              if (e.key === 'Escape') onCancel()
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="w-full text-left text-sm text-foreground border-0 border-b border-transparent hover:border-border p-0 pb-0.5 transition-colors truncate"
          >
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </button>
        )}
      </div>
    </div>
  )
}
