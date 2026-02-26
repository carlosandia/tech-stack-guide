/**
 * AIDEV-NOTE: Wrapper draggable para blocos do dashboard.
 * Drop zones visuais entre blocos (mesmo padrão do Kanban).
 * O bloco inteiro é arrastável (cursor-grab).
 */

import type { ReactNode, DragEvent } from 'react'

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
  const isDragging = draggingId === sectionId
  const showDropZone = draggingId !== null && dragOverIndex === index && draggingId !== sectionId

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver(e, index)
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(e, index)
      }}
    >
      {/* Drop zone acima do bloco */}
      <div
        className={`transition-all duration-150 rounded ${
          showDropZone
            ? 'h-[6px] mb-2 bg-primary/5 border-2 border-dashed border-primary/30'
            : 'h-0'
        }`}
      />

      {/* Bloco arrastável */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', sectionId)
          e.dataTransfer.effectAllowed = 'move'
          onDragStart(sectionId)
        }}
        onDragEnd={onDragEnd}
        className={`transition-opacity duration-150 ${
          isDragging ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
