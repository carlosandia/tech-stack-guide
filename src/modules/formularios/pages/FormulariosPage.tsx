/**
 * AIDEV-NOTE: Página principal do módulo de Formulários
 * Conforme PRD-17 - Filtros compactos no toolbar (mesma linha do título)
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { useFormularios, useContadoresFormularios } from '../hooks/useFormularios'
import type { StatusFormulario, TipoFormulario, ListarFormulariosParams } from '../services/formularios.api'
import { FormulariosList } from '../components/FormulariosList'
import { NovoFormularioModal } from '../components/NovoFormularioModal'
import { Button } from '@/components/ui/button'
import { TipoFormularioOptions } from '../schemas/formulario.schema'
import { SearchPopover } from '@/modules/admin/components/toolbar/SearchPopover'
import { StatusDropdown } from '@/modules/admin/components/toolbar/StatusDropdown'

function FormulariosToolbarFilters({
  statusFilter,
  setStatusFilter,
  tipoFilter,
  setTipoFilter,
  busca,
  setBusca,
  setPagina,
  contadores,
}: {
  statusFilter: string
  setStatusFilter: (v: StatusFormulario | '') => void
  tipoFilter: string
  setTipoFilter: (v: TipoFormulario | '') => void
  busca: string
  setBusca: (v: string) => void
  setPagina: (v: number) => void
  contadores: any
}) {
  const statusOptions = [
    { value: 'todas', label: `Todos${contadores ? ` (${contadores.todos || 0})` : ''}` },
    { value: 'rascunho', label: `Rascunho${contadores ? ` (${contadores.rascunho || 0})` : ''}` },
    { value: 'publicado', label: `Publicado${contadores ? ` (${contadores.publicado || 0})` : ''}` },
    { value: 'arquivado', label: `Arquivado${contadores ? ` (${contadores.arquivado || 0})` : ''}` },
  ]

  const tipoOptions = [
    { value: 'todos', label: 'Todos os tipos' },
    ...TipoFormularioOptions.map((opt) => ({ value: opt.value, label: opt.label })),
  ]

  return (
    <div className="flex items-center gap-1">
      <StatusDropdown
        value={statusFilter || 'todas'}
        onChange={(val) => { setStatusFilter(val === 'todas' ? '' : val as StatusFormulario); setPagina(1) }}
        options={statusOptions}
        placeholder="Status"
        defaultValue="todas"
      />
      <StatusDropdown
        value={tipoFilter || 'todos'}
        onChange={(val) => { setTipoFilter(val === 'todos' ? '' : val as TipoFormulario); setPagina(1) }}
        options={tipoOptions}
        placeholder="Tipo"
        defaultValue="todos"
      />
      <SearchPopover
        value={busca}
        onChange={(val) => { setBusca(val); setPagina(1) }}
        placeholder="Buscar formulários..."
      />
    </div>
  )
}

export function FormulariosPage() {
  const navigate = useNavigate()
  const { setActions, setSubtitle, setCenterContent } = useAppToolbar()

  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFormulario | ''>('')
  const [tipoFilter, setTipoFilter] = useState<TipoFormulario | ''>('')
  const [pagina, setPagina] = useState(1)
  const [novoModalOpen, setNovoModalOpen] = useState(false)

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

  // Toolbar: subtitle + actions + center filters
  useEffect(() => {
    setSubtitle('Formulários')
    setActions(null)
    return () => {
      setActions(null)
      setSubtitle('')
      setCenterContent(null)
    }
  }, [setActions, setSubtitle, setCenterContent])

  // Update center content when filters/contadores change
  useEffect(() => {
    setCenterContent(
      <div className="flex items-center gap-1 w-full justify-center lg:justify-end">
        <FormulariosToolbarFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          tipoFilter={tipoFilter}
          setTipoFilter={setTipoFilter}
          busca={busca}
          setBusca={setBusca}
          setPagina={setPagina}
          contadores={contadores}
        />
        <Button onClick={() => setNovoModalOpen(true)} size="sm" className="ml-1">
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Novo</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>
    )
  }, [setCenterContent, statusFilter, tipoFilter, busca, contadores])

  const handleEdit = useCallback((id: string) => {
    navigate(`/formularios/${id}`)
  }, [navigate])

  const totalPaginas = data ? Math.ceil(data.total / data.por_pagina) : 1

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
