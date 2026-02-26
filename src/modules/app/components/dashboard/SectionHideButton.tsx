/**
 * AIDEV-NOTE: Botão "Ocultar" para seções do dashboard.
 * Fica 50% fora / 50% dentro do bloco, aparece só no hover do bloco pai (group).
 * Cor vermelha transparente para indicar ação destrutiva.
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
      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-destructive/70 bg-destructive/8 border border-destructive/15 hover:bg-destructive/15 hover:text-destructive transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
      title="Ocultar esta seção"
    >
      <EyeOff className="w-3 h-3" />
      Ocultar
    </button>
  )
}
