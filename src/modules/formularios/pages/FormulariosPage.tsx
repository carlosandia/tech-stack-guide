/**
 * AIDEV-NOTE: Página principal do módulo de Formulários
 * Conforme PRD-17 - Listagem com filtros compactos no toolbar
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { useFormularios, useContadoresFormularios } from '../hooks/useFormularios'
import type { StatusFormulario, TipoFormulario, ListarFormulariosParams } from '../services/formularios.api'
import { FormulariosList } from '../components/FormulariosList'
import { NovoFormularioModal } from '../components/NovoFormularioModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TipoFormularioOptions } from '../schemas/formulario.schema'

export function FormulariosPage() {
  const navigate = useNavigate()
  const { setActions, setSubtitle } = useAppToolbar()

  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFormulario | ''>('')
  const [tipoFilter, setTipoFilter] = useState<TipoFormulario | ''>('')
  const [pagina, setPagina] = useState(1)
  const [novoModalOpen, setNovoModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Debounce busca
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusca(busca), 300)
    return () => clearTimeout(timer)
  }, [busca])

  const params: ListarFormulariosParams = {
    busca: debouncedBusca || undefined,
    status: statusFilter || undefined,
    tipo: tipoFilter || undefined,
    pagina,
    por_pagina: 20,
  }

  const { data, isLoading } = useFormularios(params)
  const { data: contadores } = useContadoresFormularios()

  // Toolbar actions
  useEffect(() => {
    setSubtitle('Formulários')
    setActions(
      <Button onClick={() => setNovoModalOpen(true)} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Novo Formulário</span>
        <span className="sm:hidden">Novo</span>
      </Button>
    )
    return () => {
      setActions(null)
      setSubtitle('')
    }
  }, [setActions, setSubtitle])

  const handleEdit = useCallback((id: string) => {
    navigate(`/app/formularios/${id}`)
  }, [navigate])

  const totalPaginas = data ? Math.ceil(data.total / data.por_pagina) : 1

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar compacto com filtros */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-2 space-y-2">
        {/* Linha 1: Status tabs */}
        {contadores && (
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { key: '', label: 'Todos', count: contadores.todos },
              { key: 'rascunho', label: 'Rascunho', count: contadores.rascunho },
              { key: 'publicado', label: 'Publicado', count: contadores.publicado },
              { key: 'arquivado', label: 'Arquivado', count: contadores.arquivado },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => { setStatusFilter(item.key as StatusFormulario | ''); setPagina(1) }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === item.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {item.label}
                <span className="ml-1 opacity-70">({item.count || 0})</span>
              </button>
            ))}
          </div>
        )}

        {/* Linha 2: Busca + Tipo */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={busca}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBusca(e.target.value); setPagina(1) }}
                className="h-8 pl-8 pr-7 text-xs"
                autoFocus
              />
              {busca && (
                <button
                  onClick={() => { setBusca(''); setSearchOpen(false) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setSearchOpen(true)}>
              <Search className="w-3.5 h-3.5" />
              Buscar
            </Button>
          )}

          <Select
            value={tipoFilter || 'todos'}
            onValueChange={(val: string) => { setTipoFilter(val === 'todos' ? '' : val as TipoFormulario); setPagina(1) }}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TipoFormularioOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse text-muted-foreground">Carregando formulários...</div>
          </div>
        ) : (
          <FormulariosList
            formularios={data?.data || []}
            onEdit={handleEdit}
          />
        )}

        {/* Paginação */}
        {data && data.total > data.por_pagina && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              {data.total} formulário{data.total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {pagina} / {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal novo formulário */}
      <NovoFormularioModal open={novoModalOpen} onOpenChange={setNovoModalOpen} />
    </div>
  )
}
