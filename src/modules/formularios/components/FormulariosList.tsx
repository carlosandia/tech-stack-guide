/**
 * AIDEV-NOTE: Lista/tabela de formulários com ações
 * Conforme Design System - seção 10.10 Table
 */

import { useState } from 'react'
import { MoreHorizontal, Copy, Trash2, Eye, EyeOff, Pencil } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FormularioStatusBadge } from './FormularioStatusBadge'
import { FormularioTipoBadge } from './FormularioTipoBadge'
import { useExcluirFormulario, useDuplicarFormulario, usePublicarFormulario, useDespublicarFormulario } from '../hooks/useFormularios'
import type { Formulario } from '../services/formularios.api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  formularios: Formulario[]
  onEdit: (id: string) => void
}

export function FormulariosList({ formularios, onEdit }: Props) {
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const excluirMutation = useExcluirFormulario()
  const duplicarMutation = useDuplicarFormulario()
  const publicarMutation = usePublicarFormulario()
  const despublicarMutation = useDespublicarFormulario()

  const handleExcluir = async () => {
    if (!excluirId) return
    await excluirMutation.mutateAsync(excluirId)
    setExcluirId(null)
  }

  if (formularios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Eye className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum formulário encontrado</h3>
        <p className="text-sm text-muted-foreground">Crie seu primeiro formulário para começar a capturar leads.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Submissões</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formularios.map((form) => (
              <TableRow key={form.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onEdit(form.id)}>
                <TableCell className="font-medium">{form.nome}</TableCell>
                <TableCell><FormularioTipoBadge tipo={form.tipo} /></TableCell>
                <TableCell><FormularioStatusBadge status={form.status} /></TableCell>
                <TableCell className="text-right text-muted-foreground">{form.total_submissoes || 0}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(form.criado_em), "dd MMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <AcoesDropdown
                    formulario={form}
                    onEdit={() => onEdit(form.id)}
                    onDuplicar={() => duplicarMutation.mutate(form.id)}
                    onPublicar={() => publicarMutation.mutate(form.id)}
                    onDespublicar={() => despublicarMutation.mutate(form.id)}
                    onExcluir={() => setExcluirId(form.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {formularios.map((form) => (
          <div
            key={form.id}
            className="border border-border rounded-lg p-4 bg-card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onEdit(form.id)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{form.nome}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <FormularioTipoBadge tipo={form.tipo} />
                  <FormularioStatusBadge status={form.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {form.total_submissoes || 0} submissões · {format(new Date(form.criado_em), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <AcoesDropdown
                  formulario={form}
                  onEdit={() => onEdit(form.id)}
                  onDuplicar={() => duplicarMutation.mutate(form.id)}
                  onPublicar={() => publicarMutation.mutate(form.id)}
                  onDespublicar={() => despublicarMutation.mutate(form.id)}
                  onExcluir={() => setExcluirId(form.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert de exclusão */}
      <AlertDialog open={!!excluirId} onOpenChange={() => setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O formulário será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Dropdown de ações por formulário
function AcoesDropdown({
  formulario,
  onEdit,
  onDuplicar,
  onPublicar,
  onDespublicar,
  onExcluir,
}: {
  formulario: Formulario
  onEdit: () => void
  onDuplicar: () => void
  onPublicar: () => void
  onDespublicar: () => void
  onExcluir: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicar}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {formulario.status === 'publicado' ? (
          <DropdownMenuItem onClick={onDespublicar}>
            <EyeOff className="w-4 h-4 mr-2" />
            Despublicar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onPublicar}>
            <Eye className="w-4 h-4 mr-2" />
            Publicar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExcluir} className="text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
