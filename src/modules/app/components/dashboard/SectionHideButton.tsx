/**
 * AIDEV-NOTE: Botão "Ocultar" inline para seções do dashboard.
 * Sempre visível, com fundo cinza claro. Ao clicar, oculta a seção
 * e sincroniza com o painel de exibição.
 */

import { EyeOff } from 'lucide-react'
import type { ToggleableSectionId } from '../../hooks/useDashboardDisplay'

interface Props {
  sectionId: ToggleableSectionId
  onHide: (id: ToggleableSectionId) => void
}

export default function SectionHideButton({ sectionId, onHide }: Props) {
  return (
    <button
      type="button"
      onClick={() => onHide(sectionId)}
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border/50 hover:bg-muted hover:text-foreground transition-colors duration-150"
      title="Ocultar esta seção"
    >
      <EyeOff className="w-3 h-3" />
      Ocultar
    </button>
  )
}
