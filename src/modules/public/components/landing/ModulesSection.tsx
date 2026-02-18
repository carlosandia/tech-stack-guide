import { useState } from 'react'
import {
  FormInput,
  Users,
  MessageCircle,
  Zap,
  Kanban,
  Mail,
  CheckSquare,
  Check,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '../../hooks/useScrollReveal'

interface Module {
  id: string
  icon: React.ElementType
  title: string
  headline: string
  benefits: string[]
}

const modules: Module[] = [
  {
    id: 'formularios',
    icon: FormInput,
    title: 'Formulários',
    headline: 'Crie formulários sem depender de desenvolvedor',
    benefits: [
      'Teste A/B para descobrir qual formulário converte mais',
      'QR Code automático para campanhas offline e eventos',
      'Notificação por WhatsApp ou e-mail quando um lead preencher',
      'Lógica condicional, analytics e todos os tipos de campo',
    ],
  },
  {
    id: 'contatos',
    icon: Users,
    title: 'Contatos',
    headline: 'Sua base de leads organizada e inteligente',
    benefits: [
      'Importação em massa e criação de oportunidades para todos de uma vez',
      'Histórico completo de oportunidades já geradas para cada contato',
      'Segmentação avançada e colunas 100% customizáveis',
      'Vínculo pessoa-empresa com visão unificada',
    ],
  },
  {
    id: 'conversas',
    icon: MessageCircle,
    title: 'Conversas',
    headline: 'WhatsApp profissional dentro da Renove',
    benefits: [
      'Sincronização completa com WhatsApp. Tudo que acontece lá, aparece aqui',
      'Correção ortográfica e gramatical integrada na escrita',
      'Agendamento de mensagens em texto ou áudio',
      'Notas privadas, mensagens prontas e anexos completos',
    ],
  },
  {
    id: 'automacoes',
    icon: Zap,
    title: 'Automações',
    headline: 'Sua operação comercial no piloto automático',
    benefits: [
      'Editor visual drag-and-drop com gatilhos, condições e ações',
      'Distribuição Round Robin automática entre vendedores',
      'Ações de CRM, comunicação e integração em um só fluxo',
      'Dispare automações por evento, tempo ou mudança de etapa',
    ],
  },
  {
    id: 'negocios',
    icon: Kanban,
    title: 'Negócios',
    headline: 'Pipeline completo com qualificação, metas e ligações',
    benefits: [
      'Kanban configurável com qualificação automática de lead MQL',
      'Ligações VoIP integradas. Ligue direto do card sem sair da Renove',
      'Agendamento de reuniões com Google Calendar e Google Meet em um clique',
      'Cadência comercial com scripts prontos disparados via WhatsApp e e-mail',
      'Métricas de no-show e metas por equipe e individual em tempo real',
    ],
  },
  {
    id: 'caixa-entrada',
    icon: Mail,
    title: 'Caixa de Entrada',
    headline: 'E-mail integrado sem sair da Renove',
    benefits: [
      'Envie, responda e consulte e-mails sem trocar de ferramenta',
      'Rastreamento de abertura para saber quem leu sua mensagem',
      'Histórico de e-mails vinculado ao contato e à oportunidade',
    ],
  },
  {
    id: 'tarefas',
    icon: CheckSquare,
    title: 'Tarefas',
    headline: 'Nenhuma atividade fica para trás',
    benefits: [
      'Central unificada de todas as tarefas do time',
      'Execução rápida vinculada a oportunidades e contatos',
      'Visão clara de pendências, prazos e prioridades',
    ],
  },
]

export function ModulesSection() {
  const [activeId, setActiveId] = useState(modules[0].id)
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(modules[0].id)
  const active = modules.find((m) => m.id === activeId)!
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: contentRef, isVisible: contentVisible } = useScrollReveal()

  return (
    <section id="funcionalidades" className="py-16 md:py-24 bg-gradient-to-b from-primary/[0.04] to-primary/[0.08]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-2xl mx-auto mb-12 md:mb-16 transition-all duration-600 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Conheça cada módulo que vai transformar sua operação
          </h2>
        </div>

        <div
          ref={contentRef}
          className={`transition-all duration-600 ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          {/* Mobile: accordion */}
          <div className="md:hidden space-y-2">
            {modules.map((m) => {
              const isOpen = mobileOpenId === m.id
              return (
                <div key={m.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setMobileOpenId(isOpen ? null : m.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <m.icon size={18} className="text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{m.title}</span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={cn(
                        'shrink-0 text-muted-foreground transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="px-4 pb-4">
                      <p className="text-sm text-primary font-medium mb-3">{m.headline}</p>
                      <ul className="space-y-2.5">
                        {m.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <Check size={16} className="text-primary mt-0.5 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: layout lado a lado */}
          <div className="hidden md:grid md:grid-cols-[280px_1fr] gap-8">
            {/* Tabs verticais */}
            <nav className="flex flex-col gap-1.5">
              {modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all ${
                    activeId === m.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <m.icon size={18} />
                  {m.title}
                </button>
              ))}
            </nav>

            {/* Conteúdo do módulo ativo */}
            <div className="bg-card rounded-xl border border-border p-8" key={active.id}>
              <div className="flex items-center gap-3 mb-2 animate-fade-in">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <active.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{active.title}</h3>
              </div>
              <p className="text-base text-primary font-medium mb-6 animate-fade-in" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>{active.headline}</p>
              <ul className="space-y-3">
                {active.benefits.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-muted-foreground animate-fade-in"
                    style={{ animationDelay: `${0.1 + i * 0.06}s`, animationFillMode: 'both' }}
                  >
                    <Check size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
