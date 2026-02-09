/**
 * AIDEV-NOTE: Tabela de desempenho por campo
 */

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import type { DesempenhoCampo } from '../../services/formularios.api'
import type { CampoFormulario } from '../../services/formularios.api'

interface Props {
  desempenho: DesempenhoCampo[]
  campos: CampoFormulario[]
}

export function DesempenhoCamposTable({ desempenho, campos }: Props) {
  if (desempenho.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        Sem dados de desempenho por campo
      </div>
    )
  }

  const getCampoLabel = (campoId: string) => {
    const campo = campos.find((c) => c.id === campoId)
    return campo?.label || campoId
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Desempenho por Campo</h3>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Campo</TableHead>
              <TableHead className="text-xs text-right">Interações</TableHead>
              <TableHead className="text-xs text-right">Erros</TableHead>
              <TableHead className="text-xs text-right">Tempo Médio (s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {desempenho.map((d) => (
              <TableRow key={d.campo_id}>
                <TableCell className="text-xs font-medium">{getCampoLabel(d.campo_id)}</TableCell>
                <TableCell className="text-xs text-right">{d.total_interacoes}</TableCell>
                <TableCell className="text-xs text-right">
                  <span className={d.total_erros > 0 ? 'text-destructive font-medium' : ''}>
                    {d.total_erros}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-right">{d.tempo_medio_segundos}s</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
