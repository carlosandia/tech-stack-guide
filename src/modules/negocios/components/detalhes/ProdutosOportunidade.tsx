/**
 * AIDEV-NOTE: Bloco compacto de produtos vinculados à oportunidade
 * Busca no catálogo, adição, edição inline de qty/preço/desconto, remoção
 * Recalcula valor total automaticamente
 */

import { useState, useRef, useCallback } from 'react'
import { Search, Loader2, X, Package, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  useProdutosOportunidade,
  useAdicionarProdutoOp,
  useAtualizarProdutoOp,
  useRemoverProdutoOp,
  useBuscarProdutosCatalogo,
} from '../../hooks/useDetalhes'

interface ProdutosOportunidadeProps {
  oportunidadeId: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function ProdutosOportunidade({ oportunidadeId }: ProdutosOportunidadeProps) {
  const { data: produtos = [], isLoading } = useProdutosOportunidade(oportunidadeId)
  const adicionarProduto = useAdicionarProdutoOp()
  const atualizarProduto = useAtualizarProdutoOp()
  const removerProduto = useRemoverProdutoOp()
  const buscarProdutos = useBuscarProdutosCatalogo()

  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Array<{
    id: string; nome: string; sku: string | null; preco: number; moeda: string; unidade: string | null
  }>>([])
  const [buscando, setBuscando] = useState(false)
  const [showResultados, setShowResultados] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const totalProdutos = produtos.reduce((sum, p) => sum + p.subtotal, 0)

  const handleBusca = useCallback((value: string) => {
    setBusca(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) {
      setResultados([])
      setShowResultados(false)
      return
    }
    setBuscando(true)
    setShowResultados(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await buscarProdutos.mutateAsync(value)
        setResultados(result)
      } catch {
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 300)
  }, [buscarProdutos])

  const handleAdicionarProduto = useCallback(async (produto: {
    id: string; nome: string; preco: number
  }) => {
    try {
      await adicionarProduto.mutateAsync({
        oportunidadeId,
        produtoId: produto.id,
        quantidade: 1,
        precoUnitario: produto.preco,
        desconto: 0,
      })
      setBusca('')
      setResultados([])
      setShowResultados(false)
      toast.success(`${produto.nome} adicionado`)
    } catch {
      toast.error('Erro ao adicionar produto')
    }
  }, [oportunidadeId, adicionarProduto])

  const handleQuantidadeChange = useCallback(async (itemId: string, delta: number, currentQty: number) => {
    const novaQtd = Math.max(1, currentQty + delta)
    try {
      await atualizarProduto.mutateAsync({
        id: itemId,
        payload: { quantidade: novaQtd },
        oportunidadeId,
      })
    } catch {
      toast.error('Erro ao atualizar quantidade')
    }
  }, [oportunidadeId, atualizarProduto])

  const handleRemover = useCallback(async (itemId: string) => {
    try {
      await removerProduto.mutateAsync({ id: itemId, oportunidadeId })
      toast.success('Produto removido')
    } catch {
      toast.error('Erro ao remover produto')
    }
  }, [oportunidadeId, removerProduto])

  const handleUpdateField = useCallback(async (itemId: string, field: string, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) return
    try {
      await atualizarProduto.mutateAsync({
        id: itemId,
        payload: { [field]: numValue },
        oportunidadeId,
      })
      setEditingItem(null)
    } catch {
      toast.error('Erro ao atualizar')
    }
  }, [oportunidadeId, atualizarProduto])

  return (
    <div className="space-y-2">
      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Total produtos</span>
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(totalProdutos)}
        </span>
      </div>

      {/* Busca */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full h-7 pl-6 pr-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring/30 placeholder:text-muted-foreground"
          />
          {buscando && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>

        {showResultados && resultados.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-0.5 bg-card border border-border rounded-md shadow-lg z-[60] max-h-[150px] overflow-y-auto">
            {resultados.map(prod => (
              <button
                key={prod.id}
                onClick={() => handleAdicionarProduto(prod)}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent transition-all duration-200 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{prod.nome}</span>
                  {prod.sku && <span className="text-[10px] text-muted-foreground">({prod.sku})</span>}
                </div>
                <span className="text-[10px] font-medium text-primary flex-shrink-0">
                  {formatCurrency(prod.preco)}
                </span>
              </button>
            ))}
          </div>
        )}

        {showResultados && !buscando && resultados.length === 0 && busca.length >= 2 && (
          <div className="absolute left-0 right-0 top-full mt-0.5 bg-card border border-border rounded-md shadow-lg z-[60] p-2">
            <p className="text-xs text-muted-foreground text-center">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Lista de produtos vinculados */}
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : produtos.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum produto vinculado</p>
      ) : (
        <div className="space-y-1.5">
          {produtos.map(item => (
            <div key={item.id} className="bg-muted/50 rounded-md px-2 py-1.5 group">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-foreground truncate flex-1">
                  {item.produto_nome}
                </span>
                <button
                  onClick={() => handleRemover(item.id)}
                  className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Remover"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1">
                {/* Quantidade */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleQuantidadeChange(item.id, -1, item.quantidade)}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                    disabled={item.quantidade <= 1}
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[10px] font-medium text-foreground w-5 text-center">
                    {item.quantidade}
                  </span>
                  <button
                    onClick={() => handleQuantidadeChange(item.id, 1, item.quantidade)}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <span className="text-[10px] text-muted-foreground">×</span>

                {/* Preço unitário (editável) */}
                {editingItem === `preco_${item.id}` ? (
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={item.preco_unitario}
                    className="w-16 h-5 text-[10px] bg-background border border-input rounded px-1 focus:outline-none focus:ring-1 focus:ring-ring/30"
                    onBlur={(e) => handleUpdateField(item.id, 'preco_unitario', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateField(item.id, 'preco_unitario', (e.target as HTMLInputElement).value)
                      if (e.key === 'Escape') setEditingItem(null)
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setEditingItem(`preco_${item.id}`)}
                    className="text-[10px] text-foreground hover:text-primary transition-colors"
                    title="Editar preço"
                  >
                    {formatCurrency(item.preco_unitario)}
                  </button>
                )}

                {/* Desconto */}
                {item.desconto_percentual > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    -{item.desconto_percentual}%
                  </span>
                )}

                {/* Subtotal */}
                <span className="text-[10px] font-semibold text-primary ml-auto">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>

              {/* Desconto editável inline */}
              {editingItem === `desc_${item.id}` ? (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Desconto:</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    defaultValue={item.desconto_percentual}
                    className="w-12 h-5 text-[10px] bg-background border border-input rounded px-1 focus:outline-none focus:ring-1 focus:ring-ring/30"
                    onBlur={(e) => handleUpdateField(item.id, 'desconto_percentual', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateField(item.id, 'desconto_percentual', (e.target as HTMLInputElement).value)
                      if (e.key === 'Escape') setEditingItem(null)
                    }}
                    autoFocus
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              ) : (
                <button
                  onClick={() => setEditingItem(`desc_${item.id}`)}
                  className="mt-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.desconto_percentual > 0 ? `Desconto: ${item.desconto_percentual}%` : '+ Desconto'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
