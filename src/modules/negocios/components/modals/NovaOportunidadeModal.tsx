/**
 * AIDEV-NOTE: Modal para criar nova oportunidade
 * Conforme PRD-07 RF-10 e Design System 10.5
 * Fluxo: Pessoa (obrigatória) + Empresa (opcional vinculada) + Oportunidade + Produtos
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, Target, Search, X, User, Building2, Plus, Trash2, ChevronDown, RefreshCw, Link2, Pencil, Info } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { negociosApi } from '../../services/negocios.api'
import { formatCurrency, unformatCurrency } from '@/lib/formatters'
import { ContatoInlineForm, validarContatoInline } from './ContatoInlineForm'
import { useCamposConfig } from '@/modules/contatos/hooks/useCamposConfig'
import { supabase } from '@/lib/supabase'

// =====================================================
// Types
// =====================================================

interface ContatoResult {
  id: string
  tipo: string
  nome?: string | null
  sobrenome?: string | null
  email?: string | null
  telefone?: string | null
  nome_fantasia?: string | null
  razao_social?: string | null
}

interface Membro {
  id: string
  nome: string
  sobrenome?: string | null
}

interface Produto {
  id: string
  nome: string
  preco: number
  sku?: string | null
  recorrente?: boolean | null
  periodo_recorrencia?: string | null
  moeda?: string | null
  unidade?: string | null
  categoria_id?: string | null
  categoria_nome?: string | null
}

interface ProdutoSelecionado {
  produto_id: string
  nome: string
  preco_unitario: number
  quantidade: number
  desconto_percentual: number
  subtotal: number
  recorrente?: boolean | null
  periodo_recorrencia?: string | null
}

interface ContatoPreSelecionado {
  id: string
  tipo: 'pessoa' | 'empresa'
  nome?: string | null
  sobrenome?: string | null
  email?: string | null
  telefone?: string | null
  empresa?: { id: string; razao_social?: string; nome_fantasia?: string } | null
}

interface NovaOportunidadeModalProps {
  funilId: string
  etapaEntradaId: string
  contatoPreSelecionado?: ContatoPreSelecionado
  origemDefault?: string
  onClose: () => void
  onSuccess: () => void
}

// AIDEV-NOTE: Opções de origem para o select — valores reconhecidos pela fn_breakdown_canal_funil
const ORIGENS_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'whatsapp_conversas', label: 'WhatsApp Conversas' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'site', label: 'Site / Landing Page' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
]

// =====================================================
// Component
// =====================================================

export function NovaOportunidadeModal({
  funilId,
  etapaEntradaId,
  contatoPreSelecionado,
  origemDefault,
  onClose,
  onSuccess,
}: NovaOportunidadeModalProps) {
  // === PESSOA state (obrigatória) ===
  const [pessoaSelecionada, setPessoaSelecionada] = useState<ContatoResult | null>(null)
  const [editandoPessoa, setEditandoPessoa] = useState(false)
  const [buscaPessoa, setBuscaPessoa] = useState('')
  const [resultadosPessoa, setResultadosPessoa] = useState<ContatoResult[]>([])
  const [buscandoPessoa, setBuscandoPessoa] = useState(false)
  const [showResultadosPessoa, setShowResultadosPessoa] = useState(false)
  const [criarNovaPessoa, setCriarNovaPessoa] = useState(false)
  const [pessoaFields, setPessoaFields] = useState<Record<string, string>>({})

  // === EMPRESA state (opcional, vinculada) ===
  const [showEmpresa, setShowEmpresa] = useState(false)
  const [empresaSelecionada, setEmpresaSelecionada] = useState<ContatoResult | null>(null)
  const [buscaEmpresa, setBuscaEmpresa] = useState('')
  const [resultadosEmpresa, setResultadosEmpresa] = useState<ContatoResult[]>([])
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false)
  const [showResultadosEmpresa, setShowResultadosEmpresa] = useState(false)
  const [criarNovaEmpresa, setCriarNovaEmpresa] = useState(false)
  const [empresaFields, setEmpresaFields] = useState<Record<string, string>>({})

  // Config global para validação e campos custom
  const { isRequired: isPessoaCampoRequired, customFields: pessoaCustomFields } = useCamposConfig('pessoa')
  const { isRequired: isEmpresaCampoRequired, customFields: empresaCustomFields } = useCamposConfig('empresa')

  // Opportunity state
  const [tipoValor, setTipoValor] = useState<'manual' | 'produtos'>('manual')
  const [valorManualFormatado, setValorManualFormatado] = useState('')
  const [responsavelId, setResponsavelId] = useState<string>('')
  const [previsaoFechamento, setPrevisaoFechamento] = useState('')

  // MRR state
  const [recorrente, setRecorrente] = useState(false)
  const [periodoRecorrencia, setPeriodoRecorrencia] = useState<string>('mensal')

  // Origem state — substitui UTM para criação manual
  const [origem, setOrigem] = useState(origemDefault || 'manual')

  // Products state
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([])
  const [buscaProduto, setBuscaProduto] = useState('')
  const [catalogoProdutos, setCatalogoProdutos] = useState<Produto[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([])
  const [showProdutosDropdown, setShowProdutosDropdown] = useState(false)
  const [carregandoProdutos, setCarregandoProdutos] = useState(false)

  // Data
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(false)

  const buscaPessoaRef = useRef<HTMLDivElement>(null)
  const buscaEmpresaRef = useRef<HTMLDivElement>(null)
  const buscaProdutoRef = useRef<HTMLDivElement>(null)
  const debouncePessoaRef = useRef<ReturnType<typeof setTimeout>>()
  const debounceEmpresaRef = useRef<ReturnType<typeof setTimeout>>()

  // Load membros + catálogo de produtos on mount
  useEffect(() => {
    negociosApi.listarMembros().then(setMembros).catch(() => {})
    setCarregandoProdutos(true)
    negociosApi.listarProdutos().then(prods => {
      setCatalogoProdutos(prods)
      setProdutosFiltrados(prods)
    }).catch(() => {}).finally(() => setCarregandoProdutos(false))
  }, [])

  // Auto-preencher contato pré-selecionado (ex: vindo de Conversas ou Contatos)
  useEffect(() => {
    if (contatoPreSelecionado?.id) {
      setPessoaSelecionada({
        id: contatoPreSelecionado.id,
        tipo: contatoPreSelecionado.tipo || 'pessoa',
        nome: contatoPreSelecionado.nome,
        sobrenome: contatoPreSelecionado.sobrenome,
        email: contatoPreSelecionado.email,
        telefone: contatoPreSelecionado.telefone,
      })
      // Se tem empresa vinculada, pré-preencher também
      if (contatoPreSelecionado.empresa?.id) {
        setShowEmpresa(true)
        setEmpresaSelecionada({
          id: contatoPreSelecionado.empresa.id,
          tipo: 'empresa',
          nome: contatoPreSelecionado.empresa.nome_fantasia || contatoPreSelecionado.empresa.razao_social || null,
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtrar produtos localmente
  useEffect(() => {
    const selectedIds = new Set(produtosSelecionados.map(p => p.produto_id))
    const term = buscaProduto.toLowerCase().trim()
    const filtered = catalogoProdutos.filter(p => {
      if (selectedIds.has(p.id)) return false
      if (!term) return true
      return p.nome.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term))
    })
    setProdutosFiltrados(filtered)
  }, [buscaProduto, catalogoProdutos, produtosSelecionados])

  // Derivar nome da pessoa para título
  const getNomeContato = useCallback(() => {
    if (pessoaSelecionada) {
      return [pessoaSelecionada.nome, pessoaSelecionada.sobrenome].filter(Boolean).join(' ')
    }
    if (criarNovaPessoa) {
      return [pessoaFields.nome, pessoaFields.sobrenome].filter(Boolean).join(' ')
    }
    return ''
  }, [pessoaSelecionada, criarNovaPessoa, pessoaFields])

  // Search pessoas with debounce
  const handleBuscaPessoa = useCallback((value: string) => {
    setBuscaPessoa(value)
    if (debouncePessoaRef.current) clearTimeout(debouncePessoaRef.current)

    if (value.length < 2) {
      setResultadosPessoa([])
      setShowResultadosPessoa(false)
      return
    }

    setBuscandoPessoa(true)
    setShowResultadosPessoa(true)

    debouncePessoaRef.current = setTimeout(async () => {
      try {
        const results = await negociosApi.buscarContatosAutocomplete(value, 'pessoa')
        setResultadosPessoa(results)
      } catch {
        setResultadosPessoa([])
      } finally {
        setBuscandoPessoa(false)
      }
    }, 300)
  }, [])

  // Search empresas with debounce
  const handleBuscaEmpresa = useCallback((value: string) => {
    setBuscaEmpresa(value)
    if (debounceEmpresaRef.current) clearTimeout(debounceEmpresaRef.current)

    if (value.length < 2) {
      setResultadosEmpresa([])
      setShowResultadosEmpresa(false)
      return
    }

    setBuscandoEmpresa(true)
    setShowResultadosEmpresa(true)

    debounceEmpresaRef.current = setTimeout(async () => {
      try {
        const results = await negociosApi.buscarContatosAutocomplete(value, 'empresa')
        setResultadosEmpresa(results)
      } catch {
        setResultadosEmpresa([])
      } finally {
        setBuscandoEmpresa(false)
      }
    }, 300)
  }, [])

  // Handle currency input
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') {
      setValorManualFormatado('')
      return
    }
    setValorManualFormatado(formatCurrency(raw))
  }

  // Add produto
  const handleAddProduto = (produto: Produto) => {
    setProdutosSelecionados(prev => [...prev, {
      produto_id: produto.id,
      nome: produto.nome,
      preco_unitario: produto.preco,
      quantidade: 1,
      desconto_percentual: 0,
      subtotal: produto.preco,
      recorrente: produto.recorrente,
      periodo_recorrencia: produto.periodo_recorrencia,
    }])
    setBuscaProduto('')
    setShowProdutosDropdown(false)

    if (produto.recorrente) {
      setRecorrente(true)
      if (produto.periodo_recorrencia) {
        setPeriodoRecorrencia(produto.periodo_recorrencia)
      }
    }
  }

  // Update produto quantidade/desconto
  const handleUpdateProduto = (index: number, field: 'quantidade' | 'desconto_percentual', value: number) => {
    setProdutosSelecionados(prev => prev.map((p, i) => {
      if (i !== index) return p
      const updated = { ...p, [field]: value }
      updated.subtotal = updated.preco_unitario * updated.quantidade * (1 - updated.desconto_percentual / 100)
      return updated
    }))
  }

  // Remove produto
  const handleRemoveProduto = (index: number) => {
    setProdutosSelecionados(prev => prev.filter((_, i) => i !== index))
  }

  // Calculate total
  const totalProdutos = produtosSelecionados.reduce((sum, p) => sum + p.subtotal, 0)
  const valorFinal = tipoValor === 'produtos' ? totalProdutos : unformatCurrency(valorManualFormatado)

  // Validation
  const pessoaValida = pessoaSelecionada || (criarNovaPessoa && validarContatoInline('pessoa', pessoaFields, isPessoaCampoRequired))
  const empresaValida = !showEmpresa || !criarNovaEmpresa || validarContatoInline('empresa', empresaFields, isEmpresaCampoRequired)
  const formularioValido = !!pessoaValida && empresaValida

  // Helper: salvar campos customizados de um contato
  const salvarCamposCustom = useCallback(async (
    fields: Record<string, string>,
    entidadeId: string,
    entidadeTipo: 'pessoa' | 'empresa',
    customFieldsDefs: typeof pessoaCustomFields,
  ) => {
    const customEntries = Object.entries(fields).filter(
      ([key, val]) => key.startsWith('custom_') && val?.trim()
    )
    if (customEntries.length === 0) return

    // Obter organizacao_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: usr } = await supabase
      .from('usuarios')
      .select('organizacao_id')
      .eq('auth_id', user.id)
      .maybeSingle()
    if (!usr?.organizacao_id) return

    for (const [key, val] of customEntries) {
      const slug = key.replace('custom_', '')
      const campoDef = customFieldsDefs.find(c => c.slug === slug)
      if (!campoDef) continue

      const campoId = campoDef.campo.id
      let insertData: Record<string, any> = {
        organizacao_id: usr.organizacao_id,
        campo_id: campoId,
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
      }

      switch (campoDef.tipo) {
        case 'numero':
        case 'decimal':
          insertData.valor_numero = val ? parseFloat(val) : null
          break
        case 'booleano':
          insertData.valor_booleano = val === 'true'
          break
        case 'data':
        case 'data_hora':
          insertData.valor_data = val || null
          break
        default:
          insertData.valor_texto = val.trim()
          break
      }

      const { error } = await supabase.from('valores_campos_customizados').insert(insertData as any)
      if (error) console.error('Erro ao salvar campo customizado:', slug, error.message)
    }
  }, [pessoaCustomFields, empresaCustomFields])

  // Submit
  const handleSubmit = async () => {
    if (!formularioValido) return
    setLoading(true)

    try {
      let empresaId: string | undefined

      // 1. Criar/obter empresa primeiro (se vinculada)
      if (showEmpresa) {
        if (empresaSelecionada) {
          empresaId = empresaSelecionada.id
        } else if (criarNovaEmpresa) {
          const payload: Record<string, any> = { tipo: 'empresa' }
          for (const [key, val] of Object.entries(empresaFields)) {
            if (val?.trim() && !key.startsWith('custom_')) {
              payload[key] = val.trim()
            }
          }
          const novaEmpresa = await negociosApi.criarContatoRapido(payload as Record<string, any> & { tipo: 'pessoa' | 'empresa' })
          empresaId = novaEmpresa.id

          // Salvar campos customizados da empresa
          await salvarCamposCustom(empresaFields, empresaId, 'empresa', empresaCustomFields)
        }
      }

      // 2. Criar/obter pessoa
      let pessoaId = pessoaSelecionada?.id

      if (pessoaId && editandoPessoa) {
        // Atualizar dados editados do contato existente
        const updatePayload: Record<string, any> = {}
        if (pessoaSelecionada?.nome !== undefined) updatePayload.nome = pessoaSelecionada.nome?.trim() || null
        if (pessoaSelecionada?.sobrenome !== undefined) updatePayload.sobrenome = pessoaSelecionada.sobrenome?.trim() || null
        if (pessoaSelecionada?.email !== undefined) updatePayload.email = pessoaSelecionada.email?.trim() || null
        if (pessoaSelecionada?.telefone !== undefined) updatePayload.telefone = pessoaSelecionada.telefone?.trim() || null
        if (empresaId) updatePayload.empresa_id = empresaId
        await negociosApi.atualizarContato(pessoaId, updatePayload)
      } else if (!pessoaId && criarNovaPessoa) {
        const payload: Record<string, any> = { tipo: 'pessoa' }
        for (const [key, val] of Object.entries(pessoaFields)) {
          if (val?.trim() && !key.startsWith('custom_')) {
            payload[key] = val.trim()
          }
        }
        // Vincular empresa se existir
        if (empresaId) {
          payload.empresa_id = empresaId
        }
        const novaPessoa = await negociosApi.criarContatoRapido(payload as Record<string, any> & { tipo: 'pessoa' | 'empresa' })
        pessoaId = novaPessoa.id

        // Salvar campos customizados da pessoa
        await salvarCamposCustom(pessoaFields, pessoaId, 'pessoa', pessoaCustomFields)
      } else if (pessoaId && empresaId) {
        // Atualizar pessoa existente com empresa_id
        await negociosApi.atualizarContato(pessoaId, { empresa_id: empresaId })
      }

      if (!pessoaId) throw new Error('Pessoa não selecionada')

      // 3. Gerar título automático: [Nome] - #[N]
      const nomeContato = getNomeContato()
      const count = await negociosApi.contarOportunidadesContato(pessoaId)
      const tituloAuto = `${nomeContato} - #${count + 1}`

      // 4. Create oportunidade
      const oportunidade = await negociosApi.criarOportunidade({
        funil_id: funilId,
        etapa_id: etapaEntradaId,
        contato_id: pessoaId,
        titulo: tituloAuto,
        valor: valorFinal || undefined,
        recorrente: recorrente || undefined,
        periodo_recorrencia: recorrente ? periodoRecorrencia : undefined,
        usuario_responsavel_id: responsavelId || undefined,
        previsao_fechamento: previsaoFechamento || undefined,
        origem: origem,
      })

      // 5. Add produtos if any
      if (tipoValor === 'produtos' && produtosSelecionados.length > 0) {
        await negociosApi.adicionarProdutosOportunidade(oportunidade.id, produtosSelecionados)
      }

      // 6. Avaliar qualificação MQL (após campos custom serem salvos)
      try {
        await negociosApi.avaliarQualificacaoMQL(oportunidade.id)
      } catch (e) {
        console.error('Erro ao avaliar qualificação:', e)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao criar oportunidade:', err)
    } finally {
      setLoading(false)
    }
  }

  // Click outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (buscaPessoaRef.current && !buscaPessoaRef.current.contains(e.target as Node)) {
        setShowResultadosPessoa(false)
      }
      if (buscaEmpresaRef.current && !buscaEmpresaRef.current.contains(e.target as Node)) {
        setShowResultadosEmpresa(false)
      }
      if (buscaProdutoRef.current && !buscaProdutoRef.current.contains(e.target as Node)) {
        setShowProdutosDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Formato de moeda p/ exibição
  const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <ModalBase
      onClose={onClose}
      title="Nova Oportunidade"
      description="Crie uma nova oportunidade de negócio"
      icon={Target}
      variant="create"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formularioValido}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Oportunidade
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* ===== SEÇÃO 1: PESSOA (obrigatória) ===== */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Pessoa <span className="text-destructive">*</span>
            </h3>
          </div>

          {/* Pessoa selecionada */}
          {pessoaSelecionada ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {[pessoaSelecionada.nome, pessoaSelecionada.sobrenome].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pessoaSelecionada.email || pessoaSelecionada.telefone || ''}
                  </p>
                </div>
                <button
                  onClick={() => setEditandoPessoa(!editandoPessoa)}
                  className="p-1.5 rounded-md hover:bg-accent transition-all duration-200"
                  title="Editar dados"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    setPessoaSelecionada(null)
                    setEditandoPessoa(false)
                    setBuscaPessoa('')
                  }}
                  className="p-1.5 rounded-md hover:bg-accent transition-all duration-200"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Campos editáveis inline */}
              {editandoPessoa && (
                <div className="px-3 pb-3 space-y-2 border-t border-primary/10 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Nome</label>
                      <input
                        type="text"
                        value={pessoaSelecionada.nome || ''}
                        onChange={(e) => setPessoaSelecionada({ ...pessoaSelecionada, nome: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Sobrenome</label>
                      <input
                        type="text"
                        value={pessoaSelecionada.sobrenome || ''}
                        onChange={(e) => setPessoaSelecionada({ ...pessoaSelecionada, sobrenome: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">E-mail</label>
                    <input
                      type="email"
                      value={pessoaSelecionada.email || ''}
                      onChange={(e) => setPessoaSelecionada({ ...pessoaSelecionada, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="w-full px-2.5 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Telefone</label>
                    <input
                      type="tel"
                      value={pessoaSelecionada.telefone || ''}
                      onChange={(e) => setPessoaSelecionada({ ...pessoaSelecionada, telefone: e.target.value })}
                      placeholder="+5511999999999"
                      className="w-full px-2.5 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : !criarNovaPessoa ? (
            /* Busca de pessoa */
            <div className="relative" ref={buscaPessoaRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={buscaPessoa}
                  onChange={(e) => handleBuscaPessoa(e.target.value)}
                  onFocus={() => buscaPessoa.length >= 2 && setShowResultadosPessoa(true)}
                  placeholder="Buscar pessoa por nome, email..."
                  className="w-full h-10 pl-9 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                />
                {buscandoPessoa && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Resultados dropdown */}
              {showResultadosPessoa && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-[60] max-h-[200px] overflow-y-auto">
                  {resultadosPessoa.length > 0 ? (
                    resultadosPessoa.map(contato => (
                      <button
                        key={contato.id}
                        onClick={() => {
                          setPessoaSelecionada(contato)
                          setBuscaPessoa('')
                          setShowResultadosPessoa(false)
                          setCriarNovaPessoa(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            {(contato.nome || '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {[contato.nome, contato.sobrenome].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contato.email || contato.telefone || ''}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : !buscandoPessoa ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Nenhuma pessoa encontrada
                    </div>
                  ) : null}

                  {/* Botão criar nova pessoa */}
                  <div className="border-t border-border">
                    <button
                      onClick={() => {
                        setCriarNovaPessoa(true)
                        setShowResultadosPessoa(false)
                        setBuscaPessoa('')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-accent transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Criar nova pessoa
                    </button>
                  </div>
                </div>
              )}

              {/* Quick action: criar nova */}
              {!showResultadosPessoa && buscaPessoa.length === 0 && (
                <button
                  onClick={() => setCriarNovaPessoa(true)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  + Criar nova pessoa
                </button>
              )}
            </div>
          ) : (
            /* Formulário inline para nova pessoa */
            <ContatoInlineForm
              tipo="pessoa"
              fields={pessoaFields}
              onChange={setPessoaFields}
              onCancel={() => setCriarNovaPessoa(false)}
            />
          )}
        </section>

        {/* ===== SEÇÃO 1.5: EMPRESA (opcional, vinculada à pessoa) ===== */}
        {!showEmpresa ? (
          <button
            onClick={() => setShowEmpresa(true)}
            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-all duration-200"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="font-medium">+ Vincular empresa (opcional)</span>
          </button>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Empresa
                </h3>
                <span className="text-[10px] text-muted-foreground font-normal normal-case">(opcional)</span>
              </div>
              <button
                onClick={() => {
                  setShowEmpresa(false)
                  setEmpresaSelecionada(null)
                  setCriarNovaEmpresa(false)
                  setEmpresaFields({})
                  setBuscaEmpresa('')
                }}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
                title="Remover vínculo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Empresa selecionada */}
            {empresaSelecionada ? (
              <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-lg">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {empresaSelecionada.nome_fantasia || empresaSelecionada.razao_social}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {empresaSelecionada.email || empresaSelecionada.telefone || ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEmpresaSelecionada(null)
                    setBuscaEmpresa('')
                  }}
                  className="p-1.5 rounded-md hover:bg-accent transition-all duration-200"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : !criarNovaEmpresa ? (
              /* Busca de empresa */
              <div className="relative" ref={buscaEmpresaRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={buscaEmpresa}
                    onChange={(e) => handleBuscaEmpresa(e.target.value)}
                    onFocus={() => buscaEmpresa.length >= 2 && setShowResultadosEmpresa(true)}
                    placeholder="Buscar empresa por nome, CNPJ..."
                    className="w-full h-10 pl-9 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                  {buscandoEmpresa && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Resultados dropdown */}
                {showResultadosEmpresa && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-[60] max-h-[200px] overflow-y-auto">
                    {resultadosEmpresa.length > 0 ? (
                      resultadosEmpresa.map(contato => (
                        <button
                          key={contato.id}
                          onClick={() => {
                            setEmpresaSelecionada(contato)
                            setBuscaEmpresa('')
                            setShowResultadosEmpresa(false)
                            setCriarNovaEmpresa(false)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-all duration-200"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {contato.nome_fantasia || contato.razao_social}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contato.email || contato.telefone || ''}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : !buscandoEmpresa ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Nenhuma empresa encontrada
                      </div>
                    ) : null}

                    {/* Botão criar nova empresa */}
                    <div className="border-t border-border">
                      <button
                        onClick={() => {
                          setCriarNovaEmpresa(true)
                          setShowResultadosEmpresa(false)
                          setBuscaEmpresa('')
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-accent transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" />
                        Criar nova empresa
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick action: criar nova */}
                {!showResultadosEmpresa && buscaEmpresa.length === 0 && (
                  <button
                    onClick={() => setCriarNovaEmpresa(true)}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    + Criar nova empresa
                  </button>
                )}
              </div>
            ) : (
              /* Formulário inline para nova empresa */
              <ContatoInlineForm
                tipo="empresa"
                fields={empresaFields}
                onChange={setEmpresaFields}
                onCancel={() => setCriarNovaEmpresa(false)}
              />
            )}
          </section>
        )}

        {/* Separador */}
        <div className="border-t border-border" />

        {/* ===== SEÇÃO 2: OPORTUNIDADE ===== */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Oportunidade</h3>
          </div>

          {/* Preview do título auto-gerado */}
          {getNomeContato() && (
            <div className="px-3 py-1.5 bg-muted/40 rounded-md mb-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Título: </span>
              <span className="text-xs font-medium text-foreground">{getNomeContato()} - #...</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Valor: toggle manual/produtos */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">Valor</label>
                <div className="flex gap-1 p-0.5 bg-muted rounded text-[10px]">
                  <button
                    onClick={() => setTipoValor('manual')}
                    className={`px-2 py-0.5 rounded transition-all duration-200 ${
                      tipoValor === 'manual' ? 'bg-card text-foreground shadow-sm font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setTipoValor('produtos')}
                    className={`px-2 py-0.5 rounded transition-all duration-200 ${
                      tipoValor === 'produtos' ? 'bg-card text-foreground shadow-sm font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Produtos
                  </button>
                </div>
              </div>

              {tipoValor === 'manual' ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={valorManualFormatado}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className="w-full h-10 pl-10 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                </div>
              ) : (
                <div className="bg-muted/30 rounded-md px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Total de produtos: </span>
                  <span className="font-semibold text-foreground">{fmtBRL(totalProdutos)}</span>
                </div>
              )}
            </div>

            {/* Toggle MRR */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-ring/30"
                />
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                  Recorrente (MRR)
                </span>
              </label>

              {recorrente && (
                <div className="relative flex-1 max-w-[160px]">
                  <select
                    value={periodoRecorrencia}
                    onChange={(e) => setPeriodoRecorrencia(e.target.value)}
                    className="w-full h-8 px-2 pr-7 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 appearance-none"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
              )}
            </div>

            {/* Produtos inline (quando tipo = produtos) */}
            {tipoValor === 'produtos' && (
              <div className="space-y-2">
                {/* Buscar e adicionar produto */}
                <div className="relative" ref={buscaProdutoRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={buscaProduto}
                      onChange={(e) => {
                        setBuscaProduto(e.target.value)
                        setShowProdutosDropdown(true)
                      }}
                      onFocus={() => setShowProdutosDropdown(true)}
                      placeholder="Buscar produto por nome ou SKU..."
                      className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                    {carregandoProdutos && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {showProdutosDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-[60] max-h-[200px] overflow-y-auto">
                      {produtosFiltrados.length > 0 ? (
                        produtosFiltrados.map(prod => (
                          <button
                            key={prod.id}
                            onClick={() => handleAddProduto(prod)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-all duration-200"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-foreground truncate">{prod.nome}</span>
                                {prod.recorrente && (
                                  <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary/10 text-primary uppercase">
                                    MRR
                                  </span>
                                )}
                              </div>
                              {(prod.categoria_nome || prod.periodo_recorrencia) && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {[prod.categoria_nome, prod.periodo_recorrencia].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {fmtBRL(prod.preco)}
                              {prod.unidade ? `/${prod.unidade}` : ''}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          {carregandoProdutos ? 'Carregando...' : 'Nenhum produto encontrado'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabela de produtos selecionados */}
                {produtosSelecionados.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Produto</th>
                          <th className="text-center px-2 py-2 text-xs font-medium text-muted-foreground w-16">Qtd</th>
                          <th className="text-center px-2 py-2 text-xs font-medium text-muted-foreground w-16">Desc%</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-24">Subtotal</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {produtosSelecionados.map((prod, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-foreground truncate">{prod.nome}</p>
                                  {prod.recorrente && (
                                    <span className="flex-shrink-0 px-1 py-0.5 text-[8px] font-bold rounded bg-primary/10 text-primary uppercase">
                                      MRR
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {fmtBRL(prod.preco_unitario)}/un
                                </p>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={prod.quantidade}
                                onChange={(e) => handleUpdateProduto(i, 'quantidade', Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="w-14 h-8 px-2 text-xs text-center bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={prod.desconto_percentual}
                                onChange={(e) => handleUpdateProduto(i, 'desconto_percentual', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                min="0"
                                max="100"
                                className="w-14 h-8 px-2 text-xs text-center bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-foreground font-medium">
                              {fmtBRL(prod.subtotal)}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                onClick={() => handleRemoveProduto(i)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30">
                          <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                            Total
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-bold text-foreground">
                            {fmtBRL(totalProdutos)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {produtosSelecionados.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                    Busque e adicione produtos acima
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Responsável */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Responsável</label>
                <div className="relative">
                  <select
                    value={responsavelId}
                    onChange={(e) => setResponsavelId(e.target.value)}
                    className="w-full h-10 px-3 pr-8 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {membros.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nome} {m.sobrenome || ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Previsão de Fechamento */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Previsão</label>
                <input
                  type="date"
                  value={previsaoFechamento}
                  onChange={(e) => setPrevisaoFechamento(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== CAMPO ORIGEM ===== */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
            Origem
            <span className="relative group">
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[10px] leading-snug text-popover-foreground bg-popover border border-border rounded-md shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                Define o canal de aquisição deste lead.<br />Aparece no relatório "Por Canal de Origem" do Dashboard.
              </span>
            </span>
          </label>
          <div className="relative">
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className="w-full h-10 px-3 pr-8 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 appearance-none"
            >
              {ORIGENS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </ModalBase>
  )
}
