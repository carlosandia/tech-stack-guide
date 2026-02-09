/**
 * AIDEV-NOTE: Página principal do módulo de Formulários
 * Conforme PRD-17 - Listagem com filtros, contadores e ações
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
    <div className="p-4 sm:p-6 space-y-4">
      {/* Contadores de status */}
      {contadores && (
        <div className="flex gap-2 flex-wrap">
          {[
            { key: '', label: 'Todos', count: contadores.todos },
            { key: 'rascunho', label: 'Rascunho', count: contadores.rascunho },
            { key: 'publicado', label: 'Publicado', count: contadores.publicado },
            { key: 'arquivado', label: 'Arquivado', count: contadores.arquivado },
          ].map((item) => (
            <Button
              key={item.key}
              variant={statusFilter === item.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter(item.key as StatusFormulario | '')
                setPagina(1)
              }}
            >
              {item.label}
              <span className="ml-1.5 text-xs opacity-70">({item.count || 0})</span>
            </Button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {searchOpen ? (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar formulários..."
              value={busca}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBusca(e.target.value); setPagina(1) }}
              className="pl-9 pr-8"
              autoFocus
            />
            {busca && (
              <button
                onClick={() => { setBusca(''); setSearchOpen(false) }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        )}

        <Select
          value={tipoFilter}
          onValueChange={(val: string) => { setTipoFilter(val as TipoFormulario | ''); setPagina(1) }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os tipos</SelectItem>
            {TipoFormularioOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <div className="flex items-center justify-between pt-2">
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

      {/* Modal novo formulário */}
      <NovoFormularioModal open={novoModalOpen} onOpenChange={setNovoModalOpen} />
    </div>
  )
}
