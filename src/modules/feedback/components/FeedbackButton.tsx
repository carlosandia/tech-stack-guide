/**
 * AIDEV-NOTE: Botao flutuante de Feedback (PRD-15)
 * Lateral direita, parcialmente escondido, aparece no hover
 * Admin/Member only
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
    <div ref={containerRef} className="fixed right-0 bottom-1/3 z-[9999] group">
      {/* Popover */}
      {open && (
        <div className="absolute bottom-16 right-4 mb-2">
          <FeedbackPopover onClose={() => setOpen(false)} />
        </div>
      )}

      {/* FAB lateral — parcialmente escondido, slide-in no hover */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center justify-center w-10 h-10 rounded-l-lg shadow-lg
          transition-all duration-300 ease-in-out
          translate-x-5 group-hover:translate-x-0
          ${open ? 'translate-x-0' : ''}
          hover:shadow-xl active:scale-95
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        `}
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
        }}
        aria-label="Enviar feedback"
        title="Enviar feedback"
      >
        <Lightbulb className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}

export default FeedbackButton
