/**
 * AIDEV-NOTE: Modal de conexão Google Calendar
 * Conforme PRD-08 Seção 5.2.3 - Google Calendar
 */

import { Calendar, Loader2, Video, Bell, CalendarClock, CalendarCheck } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { useObterAuthUrl } from '../../hooks/useIntegracoes'

interface GoogleCalendarConexaoModalProps {
  onClose: () => void
}

const RECURSOS = [
  { icon: CalendarCheck, text: 'Criar eventos e reuniões automaticamente' },
  { icon: Video, text: 'Gerar links do Google Meet integrados' },
  { icon: CalendarClock, text: 'Sincronizar agendamentos com oportunidades' },
  { icon: Bell, text: 'Notificações de próximas reuniões no CRM' },
]

export function GoogleCalendarConexaoModal({ onClose }: GoogleCalendarConexaoModalProps) {
  const obterAuthUrl = useObterAuthUrl()

  const handleConectar = async () => {
    try {
      const redirectUri = `${window.location.origin}/app/configuracoes/conexoes`
      const result = await obterAuthUrl.mutateAsync({
        plataforma: 'google',
        redirect_uri: redirectUri,
      })
      if (result.url) {
        window.location.href = result.url
      }
    } catch {
      // Toast handled by hook
    }
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Conectar Google Calendar"
      description="Sincronize agendamentos e reuniões com o CRM"
      icon={Calendar}
      variant="create"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConectar}
            disabled={obterAuthUrl.isPending}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {obterAuthUrl.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Conectar Google Calendar'
            )}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Recursos */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">O que você poderá fazer</p>
          <div className="space-y-3">
            {RECURSOS.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <r.icon className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-sm text-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            Você será redirecionado para o Google para autorizar o acesso ao seu calendário. 
            Após conectar, você poderá selecionar qual calendário usar no CRM.
          </p>
        </div>
      </div>
    </ModalBase>
  )
}
