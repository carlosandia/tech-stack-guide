/**
 * AIDEV-NOTE: Modal seletor de calendário Google
 * Conforme PRD-08 Seção 5.2.3 - Seleção de calendário pós-conexão
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Loader2, CheckCircle2, Video } from 'lucide-react'
import { toast } from 'sonner'
import { ModalBase } from '../ui/ModalBase'
import { googleCalendarApi } from '../../services/configuracoes.api'

interface GoogleCalendarSelectorModalProps {
  onClose: () => void
}

export function GoogleCalendarSelectorModal({ onClose }: GoogleCalendarSelectorModalProps) {
  const queryClient = useQueryClient()
  const [selectedCalendar, setSelectedCalendar] = useState('')
  const [criarGoogleMeet, setCriarGoogleMeet] = useState(true)
  const [sincronizarEventos, setSincronizarEventos] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['google-calendars'],
    queryFn: () => googleCalendarApi.listarCalendarios(),
  })

  const salvar = useMutation({
    mutationFn: () =>
      googleCalendarApi.selecionarCalendario({
        calendar_id: selectedCalendar,
        criar_google_meet: criarGoogleMeet,
        sincronizar_eventos: sincronizarEventos,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
      toast.success('Calendário configurado com sucesso')
      onClose()
    },
    onError: () => toast.error('Erro ao configurar calendário'),
  })

  return (
    <ModalBase
      onClose={onClose}
      title="Configurar Calendário"
      description="Selecione qual calendário sincronizar com o CRM"
      icon={Calendar}
      variant="create"
      size="md"
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
            onClick={() => salvar.mutate()}
            disabled={salvar.isPending || !selectedCalendar}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {salvar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Seleção de Calendário */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Calendário</label>
          {isLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Carregando calendários...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.calendarios || []).map((cal: any) => (
                <label
                  key={cal.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCalendar === cal.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="calendar"
                    value={cal.id}
                    checked={selectedCalendar === cal.id}
                    onChange={() => setSelectedCalendar(cal.id)}
                    className="sr-only"
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cal.backgroundColor || '#4285F4' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cal.summary}</p>
                    {cal.description && (
                      <p className="text-xs text-muted-foreground truncate">{cal.description}</p>
                    )}
                  </div>
                  {selectedCalendar === cal.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </label>
              ))}
              {(data?.calendarios || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum calendário encontrado
                </p>
              )}
            </div>
          )}
        </div>

        {/* Opções */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Opções de Sincronização</h4>

          <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
            <input
              type="checkbox"
              checked={criarGoogleMeet}
              onChange={(e) => setCriarGoogleMeet(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-foreground">Google Meet automático</p>
                <p className="text-xs text-muted-foreground">Gerar link do Meet ao criar reuniões</p>
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
            <input
              type="checkbox"
              checked={sincronizarEventos}
              onChange={(e) => setSincronizarEventos(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Sincronização bidirecional</p>
              <p className="text-xs text-muted-foreground">
                Eventos do Google Calendar aparecem no CRM e vice-versa
              </p>
            </div>
          </label>
        </div>
      </div>
    </ModalBase>
  )
}
