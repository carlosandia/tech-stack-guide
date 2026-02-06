/**
 * AIDEV-NOTE: Preview visual do card Kanban
 * Mostra como o card aparecerá no board com os campos selecionados
 */

import {
  DollarSign,
  User,
  Building2,
  Phone,
  Mail,
  UserCircle,
  CalendarDays,
  Clock,
  CheckSquare,
  Tag,
  MessageCircle,
  Calendar,
} from 'lucide-react'

interface KanbanCardPreviewProps {
  camposVisiveis: string[]
  acoesRapidas: string[]
}

const CAMPO_PREVIEW_DATA: Record<string, { icon: React.ElementType; value: React.ReactNode }> = {
  valor: {
    icon: DollarSign,
    value: <span className="text-sm font-semibold text-foreground">R$ 5.000</span>,
  },
  contato: {
    icon: User,
    value: <span className="text-sm text-foreground">João Silva</span>,
  },
  empresa: {
    icon: Building2,
    value: <span className="text-sm text-foreground">Acme Corp</span>,
  },
  telefone: {
    icon: Phone,
    value: <span className="text-sm text-muted-foreground">(11) 99999-9999</span>,
  },
  email: {
    icon: Mail,
    value: <span className="text-sm text-muted-foreground">joao@acme.com</span>,
  },
  owner: {
    icon: UserCircle,
    value: (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-[10px] font-medium text-primary">CS</span>
        </div>
        <span className="text-sm text-muted-foreground">Carlos S.</span>
      </div>
    ),
  },
  data_criacao: {
    icon: CalendarDays,
    value: <span className="text-xs text-muted-foreground">15/12/2025</span>,
  },
  previsao_fechamento: {
    icon: CalendarDays,
    value: (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">📅 15/01/2026</span>
      </div>
    ),
  },
  tarefas_pendentes: {
    icon: CheckSquare,
    value: (
      <span className="inline-flex items-center gap-1 text-xs bg-warning-muted text-warning-foreground px-1.5 py-0.5 rounded">
        ☑ 0/1
      </span>
    ),
  },
  tags: {
    icon: Tag,
    value: (
      <div className="flex items-center gap-1">
        <span className="text-xs bg-success-muted text-success-foreground px-1.5 py-0.5 rounded">VIP</span>
        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Prioridade</span>
      </div>
    ),
  },
}

const ACOES_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  telefone: { icon: Phone, label: 'Ligar' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp' },
  email: { icon: Mail, label: 'Email' },
  agendar: { icon: Calendar, label: 'Agendar' },
}

export function KanbanCardPreview({ camposVisiveis, acoesRapidas }: KanbanCardPreviewProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Preview</h3>

      <div className="w-full max-w-[320px] border border-border rounded-lg bg-card shadow-sm overflow-hidden">
        {/* Header do card */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-foreground truncate">
              Negócio Exemplo
            </span>
            {camposVisiveis.includes('tarefas_pendentes') && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5 flex-shrink-0 ml-2">
                ☑ 0/1
              </span>
            )}
          </div>

          {/* Badge MQL */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-medium bg-success-muted text-success-foreground px-1.5 py-0.5 rounded-sm">
              ✓ MQL
            </span>
          </div>

          {/* Campos visíveis */}
          <div className="space-y-1.5">
            {camposVisiveis
              .filter((key) => CAMPO_PREVIEW_DATA[key] && key !== 'tarefas_pendentes')
              .map((key) => {
                const campo = CAMPO_PREVIEW_DATA[key]
                const Icon = campo.icon
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    {campo.value}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Footer com ações rápidas */}
        {acoesRapidas.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>há 1h</span>
            </div>
            <div className="flex items-center gap-1">
              {acoesRapidas.map((key) => {
                const acao = ACOES_ICONS[key]
                if (!acao) return null
                const Icon = acao.icon
                return (
                  <button
                    key={key}
                    type="button"
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/50 text-muted-foreground transition-colors"
                    title={acao.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Visualização de como o card aparecerá no Kanban
      </p>
    </div>
  )
}
