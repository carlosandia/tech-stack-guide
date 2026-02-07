/**
 * AIDEV-NOTE: Aba Agenda (RF-14.3 Tab 5)
 * Estado vazio com orientação para configurar Google Calendar
 */

import { Calendar, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AbaAgenda() {
  const navigate = useNavigate()

  return (
    <div className="text-center py-8 space-y-3">
      <Calendar className="w-10 h-10 mx-auto text-muted-foreground/30" />
      <div>
        <p className="text-sm font-medium text-foreground">Agenda</p>
        <p className="text-xs text-muted-foreground mt-1">
          Para agendar reuniões, configure sua conexão com Google Calendar.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/app/configuracoes/conexoes')}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        Ir para Configurações
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}
