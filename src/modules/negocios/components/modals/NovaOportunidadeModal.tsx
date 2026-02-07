/**
 * AIDEV-NOTE: Modal para criar nova oportunidade
 * Conforme PRD-07 RF-10 e Design System 10.5
 * 3 seções: Contato, Oportunidade, Produtos
 * Usa ModalBase (size="lg")
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, Target, Search, X, User, Building2, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { negociosApi } from '../../services/negocios.api'


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
}

interface ProdutoSelecionado {
  produto_id: string
  nome: string
  preco_unitario: number
  quantidade: number
  desconto_percentual: number
  subtotal: number
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
  const [novoNome, setNovoNome] = useState('')
  const [novoSobrenome, setNovoSobrenome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novoNomeFantasia, setNovoNomeFantasia] = useState('')

  // Opportunity state
  const [titulo, setTitulo] = useState('')
  const [tituloManual, setTituloManual] = useState(false)
  const [tipoValor, setTipoValor] = useState<'manual' | 'produtos'>('manual')
  const [valorManual, setValorManual] = useState('')
  const [responsavelId, setResponsavelId] = useState<string>('')
  const [previsaoFechamento, setPrevisaoFechamento] = useState('')

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
  const [resultadosProduto, setResultadosProduto] = useState<Produto[]>([])
  const [showProdutosDropdown, setShowProdutosDropdown] = useState(false)

  // Data
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(false)

  const buscaContatoRef = useRef<HTMLDivElement>(null)
  const buscaProdutoRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Load membros on mount
  useEffect(() => {
    negociosApi.listarMembros().then(setMembros).catch(() => {})
  }, [])

  // Auto-generate título
  useEffect(() => {
    if (tituloManual) return
    let nomeContato = ''
    if (contatoSelecionado) {
      if (contatoSelecionado.tipo === 'empresa') {
        nomeContato = contatoSelecionado.nome_fantasia || contatoSelecionado.razao_social || ''
      } else {
        nomeContato = [contatoSelecionado.nome, contatoSelecionado.sobrenome].filter(Boolean).join(' ')
      }
    } else if (criarNovo) {
      if (tipoContato === 'empresa') {
        nomeContato = novoNomeFantasia
      } else {
        nomeContato = [novoNome, novoSobrenome].filter(Boolean).join(' ')
      }
    }
    if (nomeContato) {
      setTitulo(`${nomeContato} - Nova Oportunidade`)
    }
  }, [contatoSelecionado, criarNovo, novoNome, novoSobrenome, novoNomeFantasia, tipoContato, tituloManual])

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

  // Search produtos
  const handleBuscaProduto = useCallback((value: string) => {
    setBuscaProduto(value)
    if (value.length < 1) {
      setResultadosProduto([])
      setShowProdutosDropdown(false)
      return
    }

    setShowProdutosDropdown(true)
    const timer = setTimeout(async () => {
      try {
        const results = await negociosApi.listarProdutos(value)
        // Filter out already selected
        const selectedIds = new Set(produtosSelecionados.map(p => p.produto_id))
        setResultadosProduto(results.filter(p => !selectedIds.has(p.id)))
      } catch {
        setResultadosProduto([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [produtosSelecionados])

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
    }])
    setBuscaProduto('')
    setShowProdutosDropdown(false)
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
  const valorFinal = tipoValor === 'produtos' ? totalProdutos : (parseFloat(valorManual) || 0)

  // Validation
  const contatoValido = contatoSelecionado || (criarNovo && (
    tipoContato === 'pessoa' ? novoNome.trim().length >= 2 : novoNomeFantasia.trim().length >= 2
  ))
  const formularioValido = contatoValido && titulo.trim().length >= 3

  // Submit
  const handleSubmit = async () => {
    if (!formularioValido) return
    setLoading(true)

    try {
      let contatoId = contatoSelecionado?.id

      // Create contato if needed
      if (!contatoId && criarNovo) {
        const novoContato = await negociosApi.criarContatoRapido({
          tipo: tipoContato,
          nome: tipoContato === 'pessoa' ? novoNome.trim() : undefined,
          sobrenome: tipoContato === 'pessoa' ? novoSobrenome.trim() || undefined : undefined,
          email: novoEmail.trim() || undefined,
          telefone: novoTelefone.trim() || undefined,
          nome_fantasia: tipoContato === 'empresa' ? novoNomeFantasia.trim() : undefined,
        })
        contatoId = novoContato.id
      }

      if (!contatoId) throw new Error('Contato não selecionado')

      // Create oportunidade
      const oportunidade = await negociosApi.criarOportunidade({
        funil_id: funilId,
        etapa_id: etapaEntradaId,
        contato_id: contatoId,
        titulo: titulo.trim(),
        valor: valorFinal || undefined,
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
      // Error is shown via toast in the hook
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
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {tipoContato === 'pessoa' ? 'Nova Pessoa' : 'Nova Empresa'}
                </span>
                <button
                  onClick={() => setCriarNovo(false)}
                  className="text-xs text-primary hover:underline"
                >
                  Buscar existente
                </button>
              </div>

              {tipoContato === 'pessoa' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Nome <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Nome"
                      className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Sobrenome</label>
                    <input
                      type="text"
                      value={novoSobrenome}
                      onChange={(e) => setNovoSobrenome(e.target.value)}
                      placeholder="Sobrenome"
                      className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={novoTelefone}
                      onChange={(e) => setNovoTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Nome Fantasia <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={novoNomeFantasia}
                      onChange={(e) => setNovoNomeFantasia(e.target.value)}
                      placeholder="Nome da empresa"
                      className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={novoTelefone}
                      onChange={(e) => setNovoTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}
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
            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Título <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  setTituloManual(true)
                }}
                placeholder="Título da oportunidade"
                className="w-full h-10 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
              />
              {tituloManual && titulo.length > 0 && titulo.trim().length < 3 && (
                <p className="text-xs text-destructive mt-1">Mínimo 3 caracteres</p>
              )}
            </div>

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
                    type="number"
                    value={valorManual}
                    onChange={(e) => setValorManual(e.target.value)}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    className="w-full h-10 pl-10 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                </div>
              ) : (
                <div className="bg-muted/30 rounded-md px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Total de produtos: </span>
                  <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProdutos)}
                  </span>
                </div>
              )}
            </div>

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

        {/* Separador - só mostra seção de produtos se tipoValor === 'produtos' */}
        {tipoValor === 'produtos' && (
          <>
            <div className="border-t border-border" />

            {/* ===== SEÇÃO 3: PRODUTOS ===== */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Produtos</h3>
              </div>

              {/* Buscar e adicionar produto */}
              <div className="relative mb-3" ref={buscaProdutoRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={buscaProduto}
                    onChange={(e) => handleBuscaProduto(e.target.value)}
                    onFocus={() => buscaProduto.length >= 1 && setShowProdutosDropdown(true)}
                    placeholder="Buscar produto por nome ou SKU..."
                    className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                  />
                </div>

                {showProdutosDropdown && resultadosProduto.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-[60] max-h-[160px] overflow-y-auto">
                    {resultadosProduto.map(prod => (
                      <button
                        key={prod.id}
                        onClick={() => handleAddProduto(prod)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-all duration-200"
                      >
                        <span className="text-foreground truncate">{prod.nome}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabela de produtos */}
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
                              <p className="text-foreground truncate">{prod.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco_unitario)}/un
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
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.subtotal)}
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
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProdutos)}
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
            </section>
          </>
        )}
      </div>
    </ModalBase>
  )
}
