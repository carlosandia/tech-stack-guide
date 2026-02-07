/**
 * AIDEV-NOTE: Modal para criar nova oportunidade
 * Conforme PRD-07 RF-10 e Design System 10.5
 * Melhorias: título auto-gerado, máscara BRL, MRR, produtos inline
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, Target, Search, X, User, Building2, Plus, Trash2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { negociosApi } from '../../services/negocios.api'
import { formatCurrency, unformatCurrency } from '@/lib/formatters'
import { ContatoInlineForm, validarContatoInline } from './ContatoInlineForm'
import { useCamposConfig } from '@/modules/contatos/hooks/useCamposConfig'

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

interface NovaOportunidadeModalProps {
  funilId: string
  etapaEntradaId: string
  onClose: () => void
  onSuccess: () => void
}

// =====================================================
// Component
// =====================================================

export function NovaOportunidadeModal({
  funilId,
  etapaEntradaId,
  onClose,
  onSuccess,
}: NovaOportunidadeModalProps) {
  // Contact state
  const [tipoContato, setTipoContato] = useState<'pessoa' | 'empresa'>('pessoa')
  const [contatoSelecionado, setContatoSelecionado] = useState<ContatoResult | null>(null)
  const [buscaContato, setBuscaContato] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<ContatoResult[]>([])
  const [buscandoContato, setBuscandoContato] = useState(false)
  const [showResultados, setShowResultados] = useState(false)
  const [criarNovo, setCriarNovo] = useState(false)
  const [contatoFields, setContatoFields] = useState<Record<string, string>>({})

  // Config global para validação
  const { isRequired: isCampoRequired } = useCamposConfig(tipoContato)

  // Opportunity state
  const [tipoValor, setTipoValor] = useState<'manual' | 'produtos'>('manual')
  const [valorManualFormatado, setValorManualFormatado] = useState('')
  const [responsavelId, setResponsavelId] = useState<string>('')
  const [previsaoFechamento, setPrevisaoFechamento] = useState('')

  // MRR state
  const [recorrente, setRecorrente] = useState(false)
  const [periodoRecorrencia, setPeriodoRecorrencia] = useState<string>('mensal')

  // UTM state
  const [showUtm, setShowUtm] = useState(false)
  const [utmSource, setUtmSource] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmTerm, setUtmTerm] = useState('')
  const [utmContent, setUtmContent] = useState('')

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

  const buscaContatoRef = useRef<HTMLDivElement>(null)
  const buscaProdutoRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Load membros + catálogo de produtos on mount
  useEffect(() => {
    negociosApi.listarMembros().then(setMembros).catch(() => {})
    setCarregandoProdutos(true)
    negociosApi.listarProdutos().then(prods => {
      setCatalogoProdutos(prods)
      setProdutosFiltrados(prods)
    }).catch(() => {}).finally(() => setCarregandoProdutos(false))
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

  // Derivar nome do contato
  const getNomeContato = useCallback(() => {
    if (contatoSelecionado) {
      if (contatoSelecionado.tipo === 'empresa') {
        return contatoSelecionado.nome_fantasia || contatoSelecionado.razao_social || ''
      }
      return [contatoSelecionado.nome, contatoSelecionado.sobrenome].filter(Boolean).join(' ')
    }
    if (criarNovo) {
      if (tipoContato === 'empresa') return contatoFields.nome_fantasia || ''
      return [contatoFields.nome, contatoFields.sobrenome].filter(Boolean).join(' ')
    }
    return ''
  }, [contatoSelecionado, criarNovo, contatoFields, tipoContato])

  // Search contatos with debounce
  const handleBuscaContato = useCallback((value: string) => {
    setBuscaContato(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setResultadosBusca([])
      setShowResultados(false)
      return
    }

    setBuscandoContato(true)
    setShowResultados(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await negociosApi.buscarContatosAutocomplete(value, tipoContato)
        setResultadosBusca(results)
      } catch {
        setResultadosBusca([])
      } finally {
        setBuscandoContato(false)
      }
    }, 300)
  }, [tipoContato])

  // Handle currency input
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') {
      setValorManualFormatado('')
      return
    }
    setValorManualFormatado(formatCurrency(raw))
  }

  // Select contato
  const handleSelectContato = (contato: ContatoResult) => {
    setContatoSelecionado(contato)
    setBuscaContato('')
    setShowResultados(false)
    setCriarNovo(false)
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

    // Se produto é MRR, herdar recorrência automaticamente
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

  // Validation - título é auto-gerado, basta ter contato válido
  const contatoValido = contatoSelecionado || (criarNovo && validarContatoInline(tipoContato, contatoFields, isCampoRequired))
  const formularioValido = !!contatoValido

  // Submit
  const handleSubmit = async () => {
    if (!formularioValido) return
    setLoading(true)

    try {
      let contatoId = contatoSelecionado?.id

      // Create contato if needed
      if (!contatoId && criarNovo) {
        // Build payload from dynamic fields
        const payload: Record<string, any> = { tipo: tipoContato }
        for (const [key, val] of Object.entries(contatoFields)) {
          if (val?.trim()) {
            // Strip custom_ prefix for custom fields
            payload[key.startsWith('custom_') ? key : key] = val.trim()
          }
        }
        const novoContato = await negociosApi.criarContatoRapido(payload as Record<string, any> & { tipo: 'pessoa' | 'empresa' })
        contatoId = novoContato.id
      }

      if (!contatoId) throw new Error('Contato não selecionado')

      // Gerar título automático: [Nome] - #[N]
      const nomeContato = getNomeContato()
      const count = await negociosApi.contarOportunidadesContato(contatoId)
      const tituloAuto = `${nomeContato} - #${count + 1}`

      // Create oportunidade
      const oportunidade = await negociosApi.criarOportunidade({
        funil_id: funilId,
        etapa_id: etapaEntradaId,
        contato_id: contatoId,
        titulo: tituloAuto,
        valor: valorFinal || undefined,
        recorrente: recorrente || undefined,
        periodo_recorrencia: recorrente ? periodoRecorrencia : undefined,
        usuario_responsavel_id: responsavelId || undefined,
        previsao_fechamento: previsaoFechamento || undefined,
        utm_source: utmSource.trim() || undefined,
        utm_campaign: utmCampaign.trim() || undefined,
        utm_medium: utmMedium.trim() || undefined,
        utm_term: utmTerm.trim() || undefined,
        utm_content: utmContent.trim() || undefined,
      })

      // Add produtos if any
      if (tipoValor === 'produtos' && produtosSelecionados.length > 0) {
        await negociosApi.adicionarProdutosOportunidade(oportunidade.id, produtosSelecionados)
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
      if (buscaContatoRef.current && !buscaContatoRef.current.contains(e.target as Node)) {
        setShowResultados(false)
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
        {/* ===== SEÇÃO 1: CONTATO ===== */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contato</h3>
          </div>

          {/* Toggle Pessoa/Empresa */}
          <div className="flex gap-1 p-0.5 bg-muted rounded-md mb-3 w-fit">
            <button
              onClick={() => {
                setTipoContato('pessoa')
                setContatoSelecionado(null)
                setCriarNovo(false)
                setBuscaContato('')
                setContatoFields({})
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 ${
                tipoContato === 'pessoa'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Pessoa
            </button>
            <button
              onClick={() => {
                setTipoContato('empresa')
                setContatoSelecionado(null)
                setCriarNovo(false)
                setBuscaContato('')
                setContatoFields({})
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 ${
                tipoContato === 'empresa'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Empresa
            </button>
          </div>

          {/* Contato selecionado */}
          {contatoSelecionado ? (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                {tipoContato === 'empresa' ? (
                  <Building2 className="w-4 h-4 text-primary" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tipoContato === 'empresa'
                    ? contatoSelecionado.nome_fantasia || contatoSelecionado.razao_social
                    : [contatoSelecionado.nome, contatoSelecionado.sobrenome].filter(Boolean).join(' ')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {contatoSelecionado.email || contatoSelecionado.telefone || ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setContatoSelecionado(null)
                  setBuscaContato('')
                }}
                className="p-1.5 rounded-md hover:bg-accent transition-all duration-200"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : !criarNovo ? (
            /* Busca de contato */
            <div className="relative" ref={buscaContatoRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={buscaContato}
                  onChange={(e) => handleBuscaContato(e.target.value)}
                  onFocus={() => buscaContato.length >= 2 && setShowResultados(true)}
                  placeholder={tipoContato === 'pessoa' ? 'Buscar pessoa por nome, email...' : 'Buscar empresa por nome, CNPJ...'}
                  className="w-full h-10 pl-9 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                />
                {buscandoContato && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Resultados dropdown */}
              {showResultados && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-[60] max-h-[200px] overflow-y-auto">
                  {resultadosBusca.length > 0 ? (
                    resultadosBusca.map(contato => (
                      <button
                        key={contato.id}
                        onClick={() => handleSelectContato(contato)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {contato.tipo === 'empresa' ? (
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              {(contato.nome || '?')[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {contato.tipo === 'empresa'
                              ? contato.nome_fantasia || contato.razao_social
                              : [contato.nome, contato.sobrenome].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contato.email || contato.telefone || ''}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : !buscandoContato ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Nenhum contato encontrado
                    </div>
                  ) : null}

                  {/* Botão criar novo */}
                  <div className="border-t border-border">
                    <button
                      onClick={() => {
                        setCriarNovo(true)
                        setShowResultados(false)
                        setBuscaContato('')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-accent transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Criar {tipoContato === 'pessoa' ? 'nova pessoa' : 'nova empresa'}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick action: criar novo */}
              {!showResultados && buscaContato.length === 0 && (
                <button
                  onClick={() => setCriarNovo(true)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  + Criar {tipoContato === 'pessoa' ? 'nova pessoa' : 'nova empresa'}
                </button>
              )}
            </div>
          ) : (
            /* Formulário inline para novo contato */
            <ContatoInlineForm
              tipo={tipoContato}
              fields={contatoFields}
              onChange={setContatoFields}
              onCancel={() => setCriarNovo(false)}
            />
          )}

          {/* Preview do título auto-gerado */}
          {getNomeContato() && (
            <div className="mt-2 px-3 py-1.5 bg-muted/40 rounded-md">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Título automático: </span>
              <span className="text-xs font-medium text-foreground">{getNomeContato()} - #...</span>
            </div>
          )}
        </section>

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

        {/* ===== SEÇÃO UTM (Colapsável) ===== */}
        <div className="border-t border-border" />
        <section>
          <button
            type="button"
            onClick={() => setShowUtm(!showUtm)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showUtm ? 'rotate-90' : ''}`} />
            <span className="font-medium">Rastreamento UTM (opcional)</span>
          </button>

          {showUtm && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Source</label>
                <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="google, facebook..."
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Campaign</label>
                <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="Nome da campanha"
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Medium</label>
                <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="cpc, email, social..."
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Term</label>
                <input type="text" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} placeholder="Palavra-chave"
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">Content</label>
                <input type="text" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="Variação do anúncio"
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground" />
              </div>
            </div>
          )}
        </section>
      </div>
    </ModalBase>
  )
}
