import { useMemo } from 'react'
import { Lock, Pencil, GripVertical, Link2 } from 'lucide-react'
import type { CampoCustomizado } from '../../services/configuracoes.api'
import { tipoCampoOptions } from '../../schemas/campos.schema'
import { useVinculosCamposEmLote } from '../../hooks/useVinculosPipelines'

/**
 * AIDEV-NOTE: Lista de campos por entidade
 * Campos do sistema exibem ícone de cadeado e não são editáveis
 * Campos customizados vinculados a pipelines exibem badge informativo
 * Conforme PRD-05 - Campos Personalizados
 */

interface Props {
  campos: CampoCustomizado[]
  isAdmin: boolean
  onEdit: (campo: CampoCustomizado) => void
}

export function getTipoLabel(tipo: string): string {
  return tipoCampoOptions.find(t => t.value === tipo)?.label || tipo
}

export function CamposList({ campos, isAdmin, onEdit }: Props) {
  // Separar campos do sistema e customizados
  const camposSistema = campos.filter(c => c.sistema)
  const camposCustom = campos.filter(c => !c.sistema)

  // Buscar vínculos em lote para campos customizados
  const campoIds = useMemo(() => camposCustom.map(c => c.id), [camposCustom])
  const { data: vinculosMap = {} } = useVinculosCamposEmLote(campoIds)

  if (campos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <GripVertical className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum campo encontrado</p>
        {isAdmin && (
          <p className="text-xs text-muted-foreground mt-1">
            Clique em &quot;Novo Campo&quot; para adicionar
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Campos do Sistema */}
      {camposSistema.map(campo => (
        <div
          key={campo.id}
          onClick={() => isAdmin ? onEdit(campo) : undefined}
          className={`flex items-center justify-between px-4 py-3 rounded-lg bg-muted/30 border border-border/50 ${
            isAdmin ? 'cursor-pointer hover:bg-accent/30 transition-all duration-200' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">{campo.nome}</span>
                {campo.obrigatorio && (
                  <span className="text-xs text-destructive">*</span>
                )}
              </div>
              {campo.descricao && (
                <p className="text-xs text-muted-foreground truncate">{campo.descricao}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              {getTipoLabel(campo.tipo)}
            </span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
              Sistema
            </span>
          </div>
        </div>
      ))}

      {/* Separador se há ambos */}
      {camposSistema.length > 0 && camposCustom.length > 0 && (
        <div className="border-t border-border my-3" />
      )}

      {/* Campos Customizados */}
      {camposCustom.map(campo => {
        const vinculos = vinculosMap[campo.id] || []
        return (
          <div
            key={campo.id}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${
              !campo.ativo ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 cursor-grab" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{campo.nome}</span>
                  {campo.obrigatorio && (
                    <span className="text-xs text-destructive">*</span>
                  )}
                  {!campo.ativo && (
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                      Inativo
                    </span>
                  )}
                </div>
                {campo.descricao && (
                  <p className="text-xs text-muted-foreground truncate">{campo.descricao}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {vinculos.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-xs text-primary px-2 py-0.5 rounded-full bg-primary/10"
                  title={vinculos.map(v => v.funil_nome).join(', ')}
                >
                  <Link2 className="w-3 h-3" />
                  {vinculos.length} pipeline{vinculos.length > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                {getTipoLabel(campo.tipo)}
              </span>
              {isAdmin && (
                <button
                  onClick={() => onEdit(campo)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  title="Editar campo"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
