/**
 * AIDEV-NOTE: Wrapper draggable para blocos do dashboard.
 * Drop zones visuais entre blocos com cálculo de midpoint.
 * O bloco inteiro é arrastável (cursor-grab).
 */

import { useRef, type ReactNode, type DragEvent } from 'react'

interface Props {
  sectionId: string
  index: number
  draggingId: string | null
  dragOverIndex: number | null
  onDragStart: (sectionId: string) => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent, index: number) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent, targetIndex: number) => void
  children: ReactNode
}

export default function DashboardSectionDraggable({
  sectionId,
  index,
  draggingId,
  dragOverIndex,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = draggingId === sectionId
  const isOtherDragging = draggingId !== null && draggingId !== sectionId

  // Drop zone acima deste bloco
  const showDropAbove = isOtherDragging && dragOverIndex === index
  // Drop zone abaixo deste bloco (index + 1)
  const showDropBelow = isOtherDragging && dragOverIndex === index + 1

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (!containerRef.current || isDragging) return

    // Cálculo de midpoint — determina se cursor está na metade superior ou inferior
    const rect = containerRef.current.getBoundingClientRect()
    const midY = rect.top + rect.height / 2

    if (e.clientY < midY) {
      onDragOver(e, index) // dropar ACIMA
    } else {
      onDragOver(e, index + 1) // dropar ABAIXO
    }
  }

  const handleDragLeave = (e: DragEvent) => {
    // Anti-flickering: ignora se o mouse foi para um elemento filho
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    onDragLeave()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    if (!containerRef.current || isDragging) return

    const rect = containerRef.current.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const targetIdx = e.clientY < midY ? index : index + 1
    onDrop(e, targetIdx)
  }

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop zone ACIMA do bloco */}
      <div
        className={`transition-all duration-200 ease-in-out rounded-lg overflow-hidden ${
          showDropAbove
            ? 'h-16 mb-3 bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center'
            : 'h-0'
        }`}
      >
        {showDropAbove && (
          <span className="text-xs text-primary/50 font-medium select-none">
            Soltar aqui
          </span>
        )}
      </div>

      {/* Bloco arrastável */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', sectionId)
          e.dataTransfer.effectAllowed = 'move'
          onDragStart(sectionId)
        }}
        onDragEnd={onDragEnd}
        className={`transition-all duration-200 ease-in-out ${
          isDragging ? 'opacity-30 scale-[0.98]' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {children}
      </div>

      {/* Drop zone ABAIXO do bloco */}
      <div
        className={`transition-all duration-200 ease-in-out rounded-lg overflow-hidden ${
          showDropBelow
            ? 'h-16 mt-3 bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center'
            : 'h-0'
        }`}
      >
        {showDropBelow && (
          <span className="text-xs text-primary/50 font-medium select-none">
            Soltar aqui
          </span>
        )}
      </div>
    </div>
  )
}
