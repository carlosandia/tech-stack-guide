/**
 * AIDEV-NOTE: Botao flutuante de Feedback (PRD-15)
 * FAB no canto inferior direito - Admin/Member
 */

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { FeedbackPopover } from './FeedbackPopover'
import { Lightbulb } from 'lucide-react'

export function FeedbackButton() {
  const { role } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Visivel apenas para admin e member
  if (role !== 'admin' && role !== 'member') return null

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[9999]">
      {/* Popover */}
      {open && (
        <div className="absolute bottom-16 right-0 mb-2">
          <FeedbackPopover onClose={() => setOpen(false)} />
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
        }}
        aria-label="Enviar feedback"
        title="Enviar feedback"
      >
        <Lightbulb className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

export default FeedbackButton
