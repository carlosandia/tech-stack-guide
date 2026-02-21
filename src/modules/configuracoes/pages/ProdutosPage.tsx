/**
 * AIDEV-NOTE: Página de Produtos e Categorias
 * Conforme PRD-05 - Catálogo de Produtos
 * Tabs: Produtos | Categorias
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Package, FolderOpen, Pencil, Search, RefreshCw } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useProdutos, useCategorias } from '../hooks/useProdutos'
import { ProdutoFormModal } from '../components/produtos/ProdutoFormModal'
import { CategoriaFormModal } from '../components/produtos/CategoriaFormModal'
import { moedaOptions, unidadeOptions } from '../schemas/produtos.schema'
import type { Produto, Categoria } from '../services/configuracoes.api'

type TabAtiva = 'produtos' | 'categorias'

function formatarPreco(preco: number, moeda: string): string {
  const simbolo = moedaOptions.find(m => m.value === moeda)?.label?.split(' ')[0] || 'R$'
  return `${simbolo} ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function getUnidadeLabel(unidade: string): string {
  return unidadeOptions.find(u => u.value === unidade)?.label || unidade
}

export function ProdutosPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('produtos')
  const [busca, setBusca] = useState('')
  const [produtoModal, setProdutoModal] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [categoriaModal, setCategoriaModal] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)

  const { data: produtosData, isLoading: loadingProdutos, error: erroProdutos } = useProdutos(
    busca ? { busca } : undefined
  )
  const { data: categoriasData, isLoading: loadingCategorias, error: erroCategorias } = useCategorias()

  // Injetar ações no toolbar
  useEffect(() => {
    setSubtitle('Gerencie produtos, serviços e categorias para vincular às oportunidades')
    setActions(
      isAdmin ? (
        <button
          onClick={() => {
            if (tabAtiva === 'produtos') {
              setProdutoEditando(null)
              setProdutoModal(true)
            } else {
              setCategoriaEditando(null)
              setCategoriaModal(true)
            }
          }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            {tabAtiva === 'produtos' ? 'Novo Produto' : 'Nova Categoria'}
          </span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle, tabAtiva])

  const handleEditProduto = (produto: Produto) => {
    if (!isAdmin) return
    setProdutoEditando(produto)
    setProdutoModal(true)
  }

  const handleEditCategoria = (categoria: Categoria) => {
    if (!isAdmin) return
    setCategoriaEditando(categoria)
    setCategoriaModal(true)
  }

  const isLoading = tabAtiva === 'produtos' ? loadingProdutos : loadingCategorias
  const error = tabAtiva === 'produtos' ? erroProdutos : erroCategorias

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTabAtiva('produtos')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
              tabAtiva === 'produtos'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Package className="w-4 h-4" />
            Produtos
            {produtosData?.total !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">({produtosData.total})</span>
            )}
          </button>
          <button
            onClick={() => setTabAtiva('categorias')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
              tabAtiva === 'categorias'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Categorias
            {categoriasData?.total !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">({categoriasData.total})</span>
            )}
          </button>
        </div>

        {/* Busca (somente produtos) */}
        {tabAtiva === 'produtos' && (
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="h-8 pl-9 pr-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 w-48"
              placeholder="Buscar..."
            />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Erro ao carregar dados</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Verifique sua conexão'}
          </p>
        </div>
      ) : tabAtiva === 'produtos' ? (
        <ProdutosList
          produtos={produtosData?.produtos || []}
          isAdmin={isAdmin}
          onEdit={handleEditProduto}
        />
      ) : (
        <CategoriasList
          categorias={categoriasData?.categorias || []}
          isAdmin={isAdmin}
          onEdit={handleEditCategoria}
        />
      )}

      {/* Modais */}
      {produtoModal && (
        <ProdutoFormModal
          produto={produtoEditando}
          onClose={() => { setProdutoModal(false); setProdutoEditando(null) }}
        />
      )}
      {categoriaModal && (
        <CategoriaFormModal
          categoria={categoriaEditando}
          onClose={() => { setCategoriaModal(false); setCategoriaEditando(null) }}
        />
      )}
    </div>
  )
}

// =====================================================
// Sub-componentes
// =====================================================

function ProdutosList({ produtos, isAdmin, onEdit }: {
  produtos: Produto[]
  isAdmin: boolean
  onEdit: (p: Produto) => void
}) {
  if (produtos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
        {isAdmin && (
          <p className="text-xs text-muted-foreground mt-1">
            Clique em &quot;Novo Produto&quot; para adicionar
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {produtos.map(produto => (
        <div
          key={produto.id}
          className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${
            !produto.ativo ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">{produto.nome}</span>
                {produto.recorrente && (
                  <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    <RefreshCw className="w-3 h-3" />
                    MRR
                  </span>
                )}
                {!produto.ativo && (
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Inativo</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {produto.sku && (
                  <span className="text-xs text-muted-foreground">SKU: {produto.sku}</span>
                )}
                {produto.categoria && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${produto.categoria.cor}15`, color: produto.categoria.cor }}
                  >
                    {produto.categoria.nome}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">
                {formatarPreco(produto.preco, produto.moeda)}
              </span>
              <span className="text-xs text-muted-foreground block">
                /{getUnidadeLabel(produto.unidade)}
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={() => onEdit(produto)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                title="Editar produto"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function CategoriasList({ categorias, isAdmin, onEdit }: {
  categorias: Categoria[]
  isAdmin: boolean
  onEdit: (c: Categoria) => void
}) {
  if (categorias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <FolderOpen className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
        {isAdmin && (
          <p className="text-xs text-muted-foreground mt-1">
            Clique em &quot;Nova Categoria&quot; para adicionar
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {categorias.map(categoria => (
        <div
          key={categoria.id}
          className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${
            !categoria.ativo ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${categoria.cor}20` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoria.cor }} />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-foreground truncate block">{categoria.nome}</span>
              {categoria.descricao && (
                <p className="text-xs text-muted-foreground truncate">{categoria.descricao}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {!categoria.ativo && (
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Inativo</span>
            )}
            {isAdmin && (
              <button
                onClick={() => onEdit(categoria)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                title="Editar categoria"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProdutosPage
