import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Users, HardDrive, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useScrollReveal } from '../../hooks/useScrollReveal'

/**
 * AIDEV-NOTE: Seção de planos na landing page - posição estratégica entre
 * ComparisonSection e FAQSection. Renderiza planos diretamente do Supabase
 * sem depender de widget/edge function externa.
 */

interface Plano {
  id: string
  nome: string
  descricao: string | null
  preco_mensal: number
  preco_anual: number | null
  limite_usuarios: number
  limite_oportunidades: number | null
  limite_storage_mb: number
  popular: boolean
  ordem: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatStorage(mb: number): string {
  if (!mb || mb < 0) return 'Ilimitado'
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`
  return `${mb} MB`
}

function formatLimit(n: number | null): string {
  if (!n || n < 0 || n >= 999999) return 'Ilimitado'
  return n.toLocaleString('pt-BR')
}

export function PricingSection() {
  const { ref, isVisible } = useScrollReveal()
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlanos() {
      const { data, error } = await supabase
        .from('planos')
        .select('id, nome, descricao, preco_mensal, preco_anual, limite_usuarios, limite_oportunidades, limite_storage_mb, popular, ordem')
        .eq('ativo', true)
        .eq('visivel', true)
        .order('ordem', { ascending: true })

      if (!error && data) {
        // Filtrar planos gratuitos (trial) da landing pública
        setPlanos(data.filter((p) => (p.preco_mensal ?? 0) > 0) as Plano[])
      }
      setLoading(false)
    }
    fetchPlanos()
  }, [])

  // Calcular desconto médio do anual
  const planosComAnual = planos.filter(p => p.preco_anual && p.preco_anual > 0)
  const descontoMedio = planosComAnual.length > 0
    ? Math.round(
        planosComAnual.reduce((acc, p) => {
          const anual = p.preco_anual || 0
          return acc + ((p.preco_mensal * 12 - anual) / (p.preco_mensal * 12)) * 100
        }, 0) / planosComAnual.length
      )
    : 0

  return (
    <section id="planos" className="py-16 md:py-24 bg-muted/50">
      <div
        ref={ref}
        className={`max-w-[1200px] mx-auto px-4 md:px-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Planos e Preços
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
            Escolha o plano ideal para sua operação
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Do time enxuto à equipe comercial completa — escale sem trocar de ferramenta.
          </p>
        </div>

        {/* Toggle mensal/anual */}
        <div className="flex items-center justify-center gap-1 bg-muted rounded-lg p-1 mb-10 w-fit mx-auto">
          <button
            onClick={() => setPeriodo('mensal')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              periodo === 'mensal'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriodo('anual')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              periodo === 'anual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Anual
            {descontoMedio > 0 && (
              <span className="inline-block bg-primary text-primary-foreground text-[11px] font-bold rounded-full px-2 py-0.5">
                -{descontoMedio}%
              </span>
            )}
          </button>
        </div>

        {/* Cards de planos */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Carregando planos...</div>
        ) : planos.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Nenhum plano disponível no momento.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {planos.map((plano, idx) => {
              const preco = periodo === 'anual' && plano.preco_anual
                ? plano.preco_anual
                : plano.preco_mensal
              const precoMensal = periodo === 'anual' && plano.preco_anual
                ? plano.preco_anual / 12
                : null

              return (
                <div
                  key={plano.id}
                  className={`relative bg-background rounded-xl p-6 flex flex-col border transition-all duration-500 ${
                    plano.popular
                      ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                      : 'border-border'
                  } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  {/* Badge popular */}
                  {plano.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold rounded-full px-4 py-1 whitespace-nowrap">
                      Popular
                    </div>
                  )}

                  {/* Nome do plano */}
                  <h3 className="text-lg font-semibold text-foreground">{plano.nome}</h3>

                  {/* Preço */}
                  <div className="mt-4 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(preco)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      /{periodo === 'anual' ? 'ano' : 'mês'}
                    </span>
                    {precoMensal && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(precoMensal)}/mês
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  {plano.descricao && (
                    <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                      {plano.descricao}
                    </p>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Users size={15} className="text-primary shrink-0" />
                      {formatLimit(plano.limite_usuarios)} usuários
                    </li>
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <HardDrive size={15} className="text-primary shrink-0" />
                      {formatStorage(plano.limite_storage_mb)} storage
                    </li>
                    {plano.limite_oportunidades && (
                      <li className="flex items-center gap-2 text-sm text-foreground">
                        <Briefcase size={15} className="text-primary shrink-0" />
                        {formatLimit(plano.limite_oportunidades)} oportunidades
                      </li>
                    )}
                  </ul>

                  {/* CTA */}
                  <Link to="/trial" className="mt-auto">
                    <Button
                      className="w-full"
                      variant={plano.popular ? 'default' : 'outline'}
                    >
                      Assinar {plano.nome}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* Rodapé */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Cancele quando quiser • Suporte incluído
        </p>
      </div>
    </section>
  )
}
