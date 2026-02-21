/**
 * AIDEV-NOTE: Botao inline de Feedback (PRD-15)
 * Integrado ao header, mesmo padrao do NotificacoesSino
 * Admin/Member only
 */

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { FeedbackPopover } from './FeedbackPopover'
import { HelpCircle } from 'lucide-react'

export function FeedbackButton() {
  const { role } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  if (role !== 'admin' && role !== 'member') return null

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-md transition-colors ${
          open
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        aria-label="Enviar feedback"
        title="Enviar feedback"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[199]"
            onClick={() => setOpen(false)}
          />
          {/* Desktop: absolute ao botão / Mobile: centralizado na tela */}
          <div className="fixed inset-0 flex items-start justify-center pt-16 z-[200] pointer-events-none sm:absolute sm:inset-auto sm:right-0 sm:mt-1 sm:pt-0 sm:block">
            <div className="pointer-events-auto">
              <FeedbackPopover onClose={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FeedbackButton
