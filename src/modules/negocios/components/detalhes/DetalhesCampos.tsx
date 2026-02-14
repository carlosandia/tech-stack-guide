/**
 * AIDEV-NOTE: Bloco 1 - Campos da Oportunidade + Contato (RF-14.2)
 * Campos editáveis inline com seções Oportunidade e Contato
 * Engrenagem para show/hide campos dinâmicos (sistema + custom)
 * Empresa vinculada editável (vincular/desvincular/trocar)
 * MRR editável (recorrente + período)
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, User, Calendar, Mail, Phone, Settings2, Check, Building2, RefreshCw, Link2, X, Search, Loader2, ChevronDown, Hash, Type, ToggleLeft, Globe, FileText, Package, Tag, Plus } from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { WhatsAppConversaModal } from '../kanban/WhatsAppConversaModal'
import type { Oportunidade } from '../../services/negocios.api'
import { negociosApi } from '../../services/negocios.api'
import { useAtualizarOportunidade, useAtualizarContato, useAvaliarQualificacao } from '../../hooks/useOportunidadeDetalhes'
import { useCamposDefinicoes, useValoresCampos, SLUG_TO_CONTATO_COLUMN, getValorExibicao } from '../../hooks/useCamposDetalhes'
import type { CampoDefinicao } from '../../hooks/useCamposDetalhes'
import { ProdutosOportunidade } from './ProdutosOportunidade'
import { LigacaoModal } from '../modals/LigacaoModal'

import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useSegmentos, useSegmentarLote } from '@/modules/contatos/hooks/useSegmentos'

interface DetalhesCamposProps {
  oportunidade: Oportunidade
  membros: Array<{ id: string; nome: string; sobrenome?: string | null }>
}

// Campos NATIVOS da oportunidade (não vêm de campos_customizados)
const CAMPOS_NATIVOS_OP = [
  { id: 'valor', label: 'Valor' },
  { id: 'responsavel', label: 'Responsável' },
  { id: 'previsao', label: 'Previsão de fechamento' },
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

const PERIODOS_MRR = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

/** Ícone baseado no tipo do campo */
function getCampoIcon(tipo: string) {
  switch (tipo) {
    case 'email': return Mail
    case 'telefone': return Phone
    case 'url': return Globe
    case 'numero': case 'decimal': return Hash
    case 'booleano': return ToggleLeft
    case 'data': case 'data_hora': return Calendar
    case 'texto_longo': return FileText
    default: return Type
  }
}

// AIDEV-NOTE: Componente de Tags/Segmentos individual para o modal de detalhes
function TagsSection({ contatoId }: { contatoId: string }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: segmentosData } = useSegmentos()
  const segmentarLote = useSegmentarLote()
  const segmentos = segmentosData?.segmentos || []

  // Buscar segmentos do contato
  const { data: contatoSegmentos, refetch } = useQuery({
    queryKey: ['contato_segmentos', contatoId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contatos_segmentos')
        .select('segmento_id')
        .eq('contato_id', contatoId)
      return (data || []).map(cs => cs.segmento_id)
    },
    enabled: !!contatoId,
  })

  const segmentoIds = contatoSegmentos || []

  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  const handleToggle = (segmentoId: string) => {
    const isActive = segmentoIds.includes(segmentoId)
    segmentarLote.mutate(
      {
        ids: [contatoId],
        adicionar: isActive ? [] : [segmentoId],
        remover: isActive ? [segmentoId] : [],
      },
      { onSuccess: () => refetch() }
    )
  }

  const handleRemove = (segmentoId: string) => {
    segmentarLote.mutate(
      { ids: [contatoId], adicionar: [], remover: [segmentoId] },
      { onSuccess: () => refetch() }
    )
  }

  const activeSegmentos = segmentos.filter(s => segmentoIds.includes(s.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-3 h-3" />
          Tags
        </h3>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-all duration-200"
            title="Gerenciar tags"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-lg z-[60] animate-enter max-h-[250px] overflow-y-auto">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground">Adicionar/Remover tags</span>
              </div>
              {segmentos.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">Nenhum segmento criado</p>
              ) : (
                <div className="py-1">
                  {segmentos.map(seg => {
                    const isActive = segmentoIds.includes(seg.id)
                    return (
                      <button
                        key={seg.id}
                        onClick={() => handleToggle(seg.id)}
                        disabled={segmentarLote.isPending}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.cor }} />
                        <span className="truncate text-foreground">{seg.nome}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags ativas */}
      <div className="flex flex-wrap gap-1.5">
        {activeSegmentos.length === 0 ? (
          <span className="text-xs text-muted-foreground">Nenhuma tag</span>
        ) : (
          activeSegmentos.map(seg => (
            <span
              key={seg.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: `${seg.cor}20`, color: seg.cor }}
            >
              {seg.nome}
              <button
                onClick={() => handleRemove(seg.id)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}

export function DetalhesCampos({ oportunidade, membros }: DetalhesCamposProps) {
  const atualizarOp = useAtualizarOportunidade()
  const atualizarContato = useAtualizarContato()
  const avaliarQualificacao = useAvaliarQualificacao()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [camposVisiveis, setCamposVisiveis] = useState<Record<string, boolean>>(getCamposVisiveis)
  const [showGear, setShowGear] = useState(false)
  const gearRef = useRef<HTMLDivElement>(null)

  // Campos dinâmicos
  const { data: camposData } = useCamposDefinicoes()
  const { data: valoresOportunidade } = useValoresCampos('oportunidade', oportunidade.id)
  const { data: valoresPessoa } = useValoresCampos('pessoa', oportunidade.contato?.id)

  // Campos custom de oportunidade - exclui campos sistema que já são renderizados nativamente (valor, mrr, responsavel, previsao_fechamento)
  const SLUGS_NATIVOS_OP = ['valor', 'mrr', 'responsavel', 'previsao_fechamento']
  const camposCustomOp = useMemo(() => (camposData?.oportunidade || []).filter(c => !c.sistema || !SLUGS_NATIVOS_OP.includes(c.slug)), [camposData])

  // Campos de pessoa (sistema + custom)
  const camposPessoa = useMemo(() => camposData?.pessoa || [], [camposData])

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
      // Inicializa todos como true, exceto o que foi clicado
      for (const c of CAMPOS_NATIVOS_OP) novo[c.id] = c.id !== campoId
      for (const c of camposCustomOp) novo[`custom_op_${c.id}`] = `custom_op_${c.id}` !== campoId
      for (const c of camposPessoa) novo[`campo_${c.id}`] = `campo_${c.id}` !== campoId
      novo['contato_empresa'] = 'contato_empresa' !== campoId
    } else {
      novo[campoId] = !isCampoVisivel(campoId)
    }
    setCamposVisiveis(novo)
    localStorage.setItem(STORAGE_KEY_CAMPOS, JSON.stringify(novo))
  }

  // --- Handlers (save, empresa, MRR) ---

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

  const handleSaveCampoCustom = useCallback(async (campo: CampoDefinicao, entidadeId: string, entidadeTipo: string, value: string) => {
    try {
      const orgId = oportunidade.organizacao_id

      // Determinar qual coluna de valor usar
      let updateData: Record<string, any> = {
        organizacao_id: orgId,
        campo_id: campo.id,
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        atualizado_em: new Date().toISOString(),
      }

      switch (campo.tipo) {
        case 'numero':
        case 'decimal':
          updateData.valor_numero = value ? parseFloat(value) : null
          updateData.valor_texto = null
          break
        case 'booleano':
          updateData.valor_booleano = value === 'true'
          updateData.valor_texto = null
          break
        case 'data':
        case 'data_hora':
          updateData.valor_data = value || null
          updateData.valor_texto = null
          break
        default:
          updateData.valor_texto = value || null
          break
      }

      // Upsert: try update first, then insert
      const { data: existing } = await supabase
        .from('valores_campos_customizados')
        .select('id')
        .eq('campo_id', campo.id)
        .eq('entidade_id', entidadeId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('valores_campos_customizados')
          .update(updateData)
          .eq('id', existing.id)
      } else {
        await supabase
          .from('valores_campos_customizados')
          .insert(updateData as any)
      }

      setEditingField(null)

      // Reavaliar qualificação MQL após salvar campo customizado
      avaliarQualificacao.mutate(oportunidade.id)
    } catch {
      toast.error('Erro ao salvar campo')
    }
  }, [oportunidade.organizacao_id, oportunidade.id, avaliarQualificacao])

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

  // --- Helpers para valores de campos de pessoa (sistema) ---
  const getContatoFieldValue = (slug: string): string => {
    const col = SLUG_TO_CONTATO_COLUMN[slug]
    if (!col || !oportunidade.contato) return ''
    return (oportunidade.contato as any)[col] || ''
  }

  return (
    <div className="space-y-4">
      {/* Seção Oportunidade */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Oportunidade
          </h3>
          {/* Engrenagem show/hide */}
          <div className="relative" ref={gearRef}>
            <button
              onClick={() => setShowGear(!showGear)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-all duration-200"
              title="Campos visíveis"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            {showGear && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-[60] animate-enter max-h-[400px] overflow-y-auto">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">Campos visíveis</span>
                </div>
                <div className="py-1">
                  {/* Nativos oportunidade */}
                  <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Oportunidade
                  </div>
                  {CAMPOS_NATIVOS_OP.map(c => (
                    <GearCheckItem key={c.id} label={c.label} checked={isCampoVisivel(c.id)} onToggle={() => toggleCampo(c.id)} />
                  ))}
                  {/* Custom oportunidade */}
                  {camposCustomOp.map(c => (
                    <GearCheckItem
                      key={`custom_op_${c.id}`}
                      label={c.nome}
                      checked={isCampoVisivel(`custom_op_${c.id}`)}
                      onToggle={() => toggleCampo(`custom_op_${c.id}`)}
                      badge={c.sistema ? undefined : 'Custom'}
                    />
                  ))}

                  {/* Pessoa */}
                  <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                    Contato
                  </div>
                  {camposPessoa.map(c => (
                    <GearCheckItem
                      key={`campo_${c.id}`}
                      label={c.nome}
                      checked={isCampoVisivel(`campo_${c.id}`)}
                      onToggle={() => toggleCampo(`campo_${c.id}`)}
                      badge={c.sistema ? undefined : 'Custom'}
                    />
                  ))}
                  {/* Empresa (nativo) */}
                  <GearCheckItem
                    label="Empresa"
                    checked={isCampoVisivel('contato_empresa')}
                    onToggle={() => toggleCampo('contato_empresa')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Valor (nativo) */}
          {isCampoVisivel('valor') && (
            <div>
              {/* Toggle Manual/Produtos */}
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground">Valor</p>
                <div className="flex items-center ml-auto bg-muted rounded-md p-0.5">
                  <button
                    onClick={() => handleSaveOp('modo_valor', 'manual')}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                      (oportunidade.modo_valor || 'manual') === 'manual'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => handleSaveOp('modo_valor', 'produtos')}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-0.5 ${
                      oportunidade.modo_valor === 'produtos'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Package className="w-2.5 h-2.5" />
                    Produtos
                  </button>
                </div>
              </div>

              {/* Modo Manual */}
              {(oportunidade.modo_valor || 'manual') === 'manual' ? (
                <>
                  <FieldRow
                    icon={<span />}
                    label=""
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
                </>
              ) : (
                /* Modo Produtos */
                <div className="ml-5.5">
                  <ProdutosOportunidade oportunidadeId={oportunidade.id} />
                </div>
              )}
            </div>
          )}

          {/* Responsável (nativo) */}
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

          {/* Previsão (nativo) */}
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

          {/* Campos custom de oportunidade */}
          {camposCustomOp.map(campo => {
            const key = `custom_op_${campo.id}`
            if (!isCampoVisivel(key)) return null
            const Icon = getCampoIcon(campo.tipo)
            const valor = valoresOportunidade?.get(campo.id)
            const displayValue = getValorExibicao(campo, valor)
            const editKey = `custom_op_${campo.id}`

            return (
              <FieldRow
                key={key}
                icon={<Icon className="w-3.5 h-3.5" />}
                label={campo.nome}
                value={displayValue}
                placeholder="—"
                isEditing={editingField === editKey}
                onStartEdit={() => {
                  setEditingField(editKey)
                  setEditValue(displayValue)
                }}
                editValue={editValue}
                onEditChange={setEditValue}
                onSave={() => handleSaveCampoCustom(campo, oportunidade.id, 'oportunidade', editValue)}
                onCancel={() => setEditingField(null)}
                inputType={campo.tipo === 'data' || campo.tipo === 'data_hora' ? 'date' : campo.tipo === 'numero' || campo.tipo === 'decimal' ? 'number' : campo.tipo === 'email' ? 'email' : 'text'}
              />
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Seção Tags/Segmentos */}
      {oportunidade.contato?.id && (
        <TagsSection contatoId={oportunidade.contato.id} />
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Seção Contato */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {oportunidade.contato?.tipo === 'empresa' ? 'Empresa' : 'Contato'}
        </h3>
        <div className="space-y-3">
          {/* Campos de pessoa (sistema → mapeados para colunas nativas do contato) */}
          {camposPessoa.map(campo => {
            const key = `campo_${campo.id}`
            if (!isCampoVisivel(key)) return null
            const Icon = getCampoIcon(campo.tipo)
            const isSystemMapped = campo.sistema && SLUG_TO_CONTATO_COLUMN[campo.slug]
            const editKey = `campo_pessoa_${campo.id}`

            if (isSystemMapped) {
              // Renderiza usando coluna nativa do contato
              const nativeCol = SLUG_TO_CONTATO_COLUMN[campo.slug]!
              const value = getContatoFieldValue(campo.slug)

              return (
                <FieldRow
                  key={key}
                  icon={<Icon className="w-3.5 h-3.5" />}
                  label={campo.nome}
                  value={value}
                  placeholder="—"
                  isEditing={editingField === editKey}
                  onStartEdit={() => {
                    setEditingField(editKey)
                    setEditValue(value)
                  }}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onSave={() => handleSaveContato(nativeCol, editValue)}
                  onCancel={() => setEditingField(null)}
                  inputType={campo.tipo === 'email' ? 'email' : campo.tipo === 'telefone' ? 'tel' : campo.tipo === 'url' ? 'url' : 'text'}
                  telefoneActions={campo.tipo === 'telefone' && value ? {
                    telefone: value,
                    contatoNome: oportunidade.contato ? [oportunidade.contato.nome, oportunidade.contato.sobrenome].filter(Boolean).join(' ') : undefined,
                    contatoId: oportunidade.contato?.id,
                  } : undefined}
                  oportunidadeId={oportunidade.id}
                />
              )
            }

            // Campo customizado de pessoa
            const valor = valoresPessoa?.get(campo.id)
            const displayValue = getValorExibicao(campo, valor)

            return (
              <FieldRow
                key={key}
                icon={<Icon className="w-3.5 h-3.5" />}
                label={campo.nome}
                value={displayValue}
                placeholder="—"
                isEditing={editingField === editKey}
                onStartEdit={() => {
                  setEditingField(editKey)
                  setEditValue(displayValue)
                }}
                editValue={editValue}
                onEditChange={setEditValue}
                onSave={() => {
                  if (oportunidade.contato?.id) {
                    handleSaveCampoCustom(campo, oportunidade.contato.id, 'pessoa', editValue)
                  }
                }}
                onCancel={() => setEditingField(null)}
                inputType={campo.tipo === 'data' || campo.tipo === 'data_hora' ? 'date' : campo.tipo === 'numero' || campo.tipo === 'decimal' ? 'number' : campo.tipo === 'email' ? 'email' : 'text'}
              />
            )
          })}

          {/* Empresa vinculada (nativo) */}
          {isCampoVisivel('contato_empresa') && oportunidade.contato?.tipo === 'pessoa' && (
            <div className="flex items-start gap-2" ref={empresaSearchRef}>
              <Building2 className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground mb-0.5">Empresa</p>

                {oportunidade.contato?.empresa ? (
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-foreground truncate flex-1">
                      {(oportunidade.contato.empresa as any)?.nome_fantasia || (oportunidade.contato.empresa as any)?.razao_social || '—'}
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

function GearCheckItem({ label, checked, onToggle, badge }: { label: string; checked: boolean; onToggle: () => void; badge?: string }) {
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
      <span className={`flex-1 text-left ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
      {badge && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{badge}</span>
      )}
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
  telefoneActions?: {
    telefone: string
    contatoNome?: string
    contatoId?: string
  }
  oportunidadeId?: string
}

function FieldRow({
  icon, label, value, placeholder, isEditing,
  onStartEdit, editValue, onEditChange, onSave, onCancel, inputType = 'text',
  telefoneActions, oportunidadeId,
}: FieldRowProps) {
  const [ligacaoOpen, setLigacaoOpen] = useState(false)
  const [whatsappOpen, setWhatsappOpen] = useState(false)

  return (
    <>
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
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onStartEdit}
                className="flex-1 text-left text-sm text-foreground border-0 border-b border-transparent hover:border-border p-0 pb-0.5 transition-colors truncate"
              >
                {value || <span className="text-muted-foreground">{placeholder}</span>}
              </button>
              {telefoneActions && value && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLigacaoOpen(true) }}
                    className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Ligar"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setWhatsappOpen(true) }}
                    className="p-1 text-muted-foreground hover:text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success-muted))] rounded transition-colors"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {ligacaoOpen && telefoneActions && (
        <LigacaoModal
          telefone={telefoneActions.telefone}
          contatoNome={telefoneActions.contatoNome}
          oportunidadeId={oportunidadeId}
          onClose={() => setLigacaoOpen(false)}
        />
      )}

      {whatsappOpen && telefoneActions && (
        <WhatsAppConversaModal
          isOpen={whatsappOpen}
          onClose={() => setWhatsappOpen(false)}
          contatoId={telefoneActions.contatoId || ''}
          contatoNome={telefoneActions.contatoNome || ''}
          telefone={telefoneActions.telefone}
        />
      )}
    </>
  )
}
