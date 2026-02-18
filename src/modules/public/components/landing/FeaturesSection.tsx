import {
  Columns3,
  Zap,
  MessageCircle,
  Users,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Grid de funcionalidades com benefícios (não técnico)
 */
const features = [
  {
    icon: Columns3,
    title: 'Pipeline visual (Kanban)',
    benefit: 'Veja todos os seus negócios organizados por etapa. Arraste e solte para atualizar o status em segundos.',
  },
  {
    icon: Zap,
    title: 'Automações inteligentes',
    benefit: 'Crie regras automáticas: distribua leads, envie alertas e mova negócios sem intervenção manual.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp e Instagram integrados',
    benefit: 'Responda seus clientes direto do CRM. Histórico completo de conversas em um só lugar.',
  },
  {
    icon: Users,
    title: 'Gestão de equipes',
    benefit: 'Distribua leads entre vendedores, defina metas individuais e acompanhe a performance em tempo real.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios e metas',
    benefit: 'Dashboards com métricas que importam: taxa de conversão, ticket médio, tempo de fechamento e mais.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Campos customizáveis',
    benefit: 'Adapte o CRM à sua operação. Crie campos, etapas e funis que fazem sentido para o seu negócio.',
  },
]

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-16 md:py-24 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Tudo o que sua equipe comercial precisa em um só lugar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <f.icon size={22} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
