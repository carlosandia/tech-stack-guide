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
} from 'lucide-react'

/**
 * AIDEV-NOTE: Seção estratégica de módulos do CRM Renove
 * Cada módulo apresenta benefícios em linguagem de dor/solução para o ICP
 * Layout: tabs verticais (desktop) / horizontais scrolláveis (mobile)
 */

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
    headline: 'WhatsApp profissional dentro do CRM',
    benefits: [
      'Sincronização completa com WhatsApp — tudo que acontece lá, aparece aqui',
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
    headline: 'Pipeline completo com qualificação e metas',
    benefits: [
      'Kanban configurável com identificação automática de lead MQL',
      'Rodízio de leads e cadência comercial com scripts prontos',
      'Disparo de scripts via WhatsApp e e-mail direto da oportunidade',
      'Metas visíveis por equipe e individual com acompanhamento em tempo real',
    ],
  },
  {
    id: 'caixa-entrada',
    icon: Mail,
    title: 'Caixa de Entrada',
    headline: 'E-mail integrado sem sair do CRM',
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
  const active = modules.find((m) => m.id === activeId)!

  return (
    <section id="modulos" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Módulos
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Conheça cada módulo que vai transformar sua operação
          </h2>
        </div>

        {/* Mobile: tabs horizontais scrolláveis */}
        <div className="flex md:hidden overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide -mx-4 px-4">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeId === m.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              <m.icon size={16} />
              {m.title}
            </button>
          ))}
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
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <active.icon size={20} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{active.title}</h3>
            </div>
            <p className="text-base text-primary font-medium mb-6">{active.headline}</p>
            <ul className="space-y-3">
              {active.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile: conteúdo do módulo ativo */}
        <div className="md:hidden bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <active.icon size={20} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{active.title}</h3>
          </div>
          <p className="text-sm text-primary font-medium mb-4">{active.headline}</p>
          <ul className="space-y-3">
            {active.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check size={16} className="text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
