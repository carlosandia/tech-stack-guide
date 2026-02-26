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

  // Drop zone única: apenas ACIMA deste bloco
  const showDropAbove = isOtherDragging && dragOverIndex === index

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'

    if (!containerRef.current || isDragging) return

    const rect = containerRef.current.getBoundingClientRect()
    const midY = rect.top + rect.height / 2

    if (e.clientY < midY) {
      onDragOver(e, index)
    } else {
      onDragOver(e, index + 1)
    }
  }

  const handleDragLeave = (e: DragEvent) => {
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    onDragLeave()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
      {/* Drop zone única — ACIMA do bloco */}
      <div
        className={`transition-all duration-200 ease-in-out rounded-lg overflow-hidden ${
          showDropAbove
            ? 'h-14 mb-2 bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center'
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
    </div>
  )
}
