import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Building2 } from 'lucide-react'
import heroImg from '@/assets/landing-hero-dashboard.jpg'

/**
 * AIDEV-NOTE: Hero section - Topo do funil
 * Headline atacando dor principal + CTA duplo + imagem do produto
 */
export function HeroSection() {
  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-background relative overflow-hidden">
      {/* Gradiente sutil de fundo */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="space-y-6 animate-fade-in">
            <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium gap-1.5">
              <Building2 size={14} />
              Usado por +200 empresas B2B
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-foreground leading-[1.1] tracking-tight">
              Seus leads estão{' '}
              <span className="text-primary">escapando</span> enquanto
              marketing e vendas não se falam
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              A Renove centraliza todos os seus canais, organiza seu funil de vendas
              e garante que nenhum lead fique sem resposta. Mais controle, mais conversões,
              mais receita.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/trial">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-md hover:shadow-lg transition-shadow">
                  Teste grátis por 14 dias
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-6 h-12 gap-2">
                <Play size={16} className="text-primary" />
                Ver demonstração
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Configuração em 2 minutos • Cancele quando quiser
            </p>
          </div>

          {/* Imagem do produto */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-muted">
              <img
                src={heroImg}
                alt="Dashboard do CRM Renove mostrando pipeline de vendas"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
            {/* Badge flutuante */}
            <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-background rounded-lg shadow-lg border border-border p-3 md:p-4 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="text-success font-bold text-sm">↑</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa de conversão</p>
                  <p className="text-lg font-bold text-foreground">+34%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
