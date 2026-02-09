/**
 * AIDEV-NOTE: Lista de submissões do formulário com filtro e paginação
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubmissoesFormulario } from '../../hooks/useFormularioSubmissoes'
import { SubmissaoDetalhe } from './SubmissaoDetalhe'
import type { SubmissaoFormulario } from '../../services/formularios.api'

interface Props {
  formularioId: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'nova', label: 'Nova' },
  { value: 'processada', label: 'Processada' },
  { value: 'spam', label: 'Spam' },
  { value: 'erro', label: 'Erro' },
]

const STATUS_COLORS: Record<string, string> = {
  nova: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  spam: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  erro: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function SubmissoesList({ formularioId }: Props) {
  const [status, setStatus] = useState('')
  const [pagina, setPagina] = useState(1)
  const [selectedSubmissao, setSelectedSubmissao] = useState<SubmissaoFormulario | null>(null)
  const por_pagina = 15

  const { data, isLoading } = useSubmissoesFormulario({
    formularioId,
    status: status || undefined,
    pagina,
    por_pagina,
  })

  const submissoes = data?.data || []
  const total = data?.total || 0
  const totalPaginas = Math.ceil(total / por_pagina)

  if (selectedSubmissao) {
    return (
      <SubmissaoDetalhe
        submissao={selectedSubmissao}
        onVoltar={() => setSelectedSubmissao(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatus(opt.value); setPagina(1) }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              status === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {total} submiss{total === 1 ? 'ão' : 'ões'}
        </span>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>
      ) : submissoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Inbox className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma submissão encontrada</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Origem</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Score</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {submissoes.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedSubmissao(sub)}
                >
                  <td className="px-3 py-2.5 text-foreground">
                    {format(new Date(sub.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[sub.status] || 'bg-muted text-muted-foreground'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                    {sub.utm_source || 'direto'}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">
                    {sub.lead_score ?? '-'}
                  </td>
                  <td className="px-3 py-2.5">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
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
      )}
    </div>
  )
}
