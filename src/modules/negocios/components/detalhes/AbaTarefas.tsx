/**
 * AIDEV-NOTE: Aba Tarefas (RF-14.3 Tab 2)
 * Placeholder - tarefas automáticas dependem de configuração de pipeline (Iteração 6)
 */

import { CheckSquare } from 'lucide-react'

interface AbaTarefasProps {
  oportunidadeId: string
}

export function AbaTarefas({ oportunidadeId: _id }: AbaTarefasProps) {
  return (
    <div className="text-center py-8 space-y-3">
      <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/30" />
      <div>
        <p className="text-sm font-medium text-foreground">Tarefas</p>
        <p className="text-xs text-muted-foreground mt-1">
          As tarefas automáticas serão habilitadas após configurar as atividades da pipeline.
        </p>
        <p className="text-xs text-muted-foreground">
          Acesse <span className="font-medium">Configurações &gt; Pipeline &gt; Atividades</span> para configurar.
        </p>
      </div>
    </div>
  )
}
