import { useState, useEffect, useRef } from 'react'

import { Check, Loader2, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PreCadastroModal } from '../../components/PreCadastroModal'

/**
 * AIDEV-NOTE: Seção de planos na landing page - posição estratégica entre
 * ComparisonSection e FAQSection. Replica a mesma estrutura da /planos page
 * com 4 colunas (Trial + 3 pagos), botões padronizados e modal de demonstração.
 */

interface PlanoDb {
  id: string
  nome: string
  descricao: string | null
  preco_mensal: number | null
  preco_anual: number | null
  limite_usuarios: number | null
  limite_oportunidades: number | null
  limite_storage_mb: number | null
  stripe_price_id_mensal: string | null
  stripe_price_id_anual: string | null
  popular: boolean | null
  ordem: number | null
}

interface TrialConfig {
  trial_habilitado: boolean
  trial_dias: number
}

interface TrialPlan {
  id: string
  limite_usuarios: number | null
  limite_oportunidades: number | null
  limite_storage_mb: number | null
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatStorage(mb: number | null): string {
  if (!mb || mb < 0) return 'Ilimitado'
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`
  return `${mb}MB`
}

function formatLimit(n: number | null): string {
  if (!n || n < 0 || n >= 999999) return 'Ilimitado'
  return n.toLocaleString('pt-BR')
}

export function PricingSection() {
  const { ref, isVisible } = useScrollReveal()
  
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')
  const [planos, setPlanos] = useState<PlanoDb[]>([])
  const [trialPlan, setTrialPlan] = useState<TrialPlan | null>(null)
  const [trialConfig, setTrialConfig] = useState<TrialConfig>({ trial_habilitado: true, trial_dias: 14 })
  const [loading, setLoading] = useState(true)

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPlano, setModalPlano] = useState<{ id: string; nome: string; isTrial: boolean } | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const demoContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      const [planosRes, configRes] = await Promise.all([
        supabase
          .from('planos')
          .select('id, nome, descricao, preco_mensal, preco_anual, limite_usuarios, limite_oportunidades, limite_storage_mb, stripe_price_id_mensal, stripe_price_id_anual, popular, ordem')
          .eq('ativo', true)
          .eq('visivel', true)
          .order('ordem', { ascending: true }),
        supabase
          .from('configuracoes_globais')
          .select('configuracoes')
          .eq('plataforma', 'stripe')
          .single(),
      ])

      if (!planosRes.error && planosRes.data) {
        const all = planosRes.data as PlanoDb[]
        const trial = all.find(p => p.nome.toLowerCase() === 'trial' || (!p.preco_mensal || p.preco_mensal === 0))
        const paid = all.filter(p => p.preco_mensal && p.preco_mensal > 0)
        if (trial) {
          setTrialPlan({
            id: trial.id,
            limite_usuarios: trial.limite_usuarios,
            limite_oportunidades: trial.limite_oportunidades,
            limite_storage_mb: trial.limite_storage_mb,
          })
        }
        setPlanos(paid)
      }

      if (configRes.data?.configuracoes) {
        const c = configRes.data.configuracoes as Record<string, unknown>
        setTrialConfig({
          trial_habilitado: c.trial_habilitado !== false,
          trial_dias: (c.trial_dias as number) || 14,
        })
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  // Demo modal script injection - fetch JS text and execute directly
  useEffect(() => {
    if (!demoModalOpen) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const container = demoContainerRef.current
      if (!container || cancelled) return
      container.innerHTML = '<div style="display:flex;justify-content:center;padding:40px"><svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>'
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-formulario-loader?slug=demonstracao-crm-mlrb6yoz&mode=inline`
        const resp = await fetch(url)
        if (!resp.ok || cancelled) return
        const jsText = await resp.text()
        if (cancelled) return
        // Clear loading spinner, add target container for the widget
        container.innerHTML = '<div id="renove-form-demo-target"></div>'
        // Execute the widget JS - it will find the container by data attribute or ID
        const script = document.createElement('script')
        script.setAttribute('data-form-slug', 'demonstracao-crm-mlrb6yoz')
        script.textContent = jsText
        container.appendChild(script)
      } catch (err) {
        if (!cancelled) {
          container.innerHTML = '<p style="text-align:center;color:#6B7280;padding:20px">Erro ao carregar formulário. Tente novamente.</p>'
        }
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (demoContainerRef.current) demoContainerRef.current.innerHTML = ''
    }
  }, [demoModalOpen])

  const handleSelectPlan = (plano: PlanoDb) => {
    setModalPlano({ id: plano.id, nome: plano.nome, isTrial: false })
    setModalOpen(true)
  }

  const handleStartTrial = () => {
    if (!trialPlan) return
    setModalPlano({ id: trialPlan.id, nome: 'Trial', isTrial: true })
    setModalOpen(true)
  }

  const handleCheckout = async (preCadastroId: string) => {
    setModalOpen(false)
    if (!modalPlano) return
    const loadingKey = modalPlano.isTrial ? 'trial' : modalPlano.id
    setCheckoutLoading(loadingKey)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plano_id: modalPlano.id,
          periodo: modalPlano.isTrial ? 'mensal' : periodo,
          is_trial: modalPlano.isTrial,
          pre_cadastro_id: preCadastroId,
        },
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err) {
      console.error('Error creating checkout:', err)
      alert('Erro ao iniciar checkout. Tente novamente.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  // Desconto anual
  const planosComAnual = planos.filter(p => p.preco_mensal && p.preco_mensal > 0 && p.preco_anual && p.preco_anual > 0)
  const descontoMedio = planosComAnual.length > 0
    ? Math.round(
        planosComAnual.reduce((acc, p) => {
          const mensalAnualizado = (p.preco_mensal ?? 0) * 12
          const anual = p.preco_anual ?? 0
          return acc + ((mensalAnualizado - anual) / mensalAnualizado) * 100
        }, 0) / planosComAnual.length
      )
    : 0

  return (
    <section id="planos" className="py-16 md:py-24 bg-muted/50">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-4 md:px-6 transition-all duration-700 ${
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

        {/* Cards de planos - 4 colunas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card Trial */}
            {trialConfig.trial_habilitado && trialPlan && (
              <div
                className={`relative bg-background rounded-xl border border-border p-6 flex flex-col transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                <h3 className="text-lg font-semibold text-foreground">Trial</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Teste gratis por {trialConfig.trial_dias} dias
                </p>

                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold text-foreground">Gratis</span>
                  <p className="text-sm text-muted-foreground mt-1">{trialConfig.trial_dias} dias</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">
                      {trialPlan.limite_usuarios === -1 ? 'Usuários ilimitados' : `${trialPlan.limite_usuarios || 2} usuários`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{formatLimit(trialPlan.limite_oportunidades)} oportunidades</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{formatStorage(trialPlan.limite_storage_mb)} armazenamento</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">Suporte por email</span>
                  </li>
                </ul>

                <button
                  onClick={handleStartTrial}
                  disabled={checkoutLoading === 'trial'}
                  className="w-full py-2.5 px-4 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === 'trial' ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Teste grátis agora'
                  )}
                </button>
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2"
                >
                  Solicite uma demonstração
                </button>
              </div>
            )}

            {/* Cards dos planos pagos */}
            {planos.map((plano, idx) => {
              const isPopular = plano.popular === true
              const price = periodo === 'anual' ? (plano.preco_anual || 0) : (plano.preco_mensal || 0)

              return (
                <div
                  key={plano.id}
                  className={`relative bg-background rounded-xl border p-6 flex flex-col transition-all duration-500 ${
                    isPopular ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${(idx + 1) * 100}ms` }}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        <Star className="w-3 h-3" />
                        Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">{plano.nome}</h3>
                  {plano.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                  )}

                  <div className="mt-4 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{formatPrice(price)}</span>
                      <span className="text-sm text-muted-foreground">/{periodo === 'anual' ? 'ano' : 'mes'}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{formatLimit(plano.limite_usuarios)} usuários</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{formatLimit(plano.limite_oportunidades)} oportunidades</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{formatStorage(plano.limite_storage_mb)} armazenamento</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plano)}
                    disabled={checkoutLoading === plano.id}
                    className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      isPopular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border hover:bg-accent'
                    }`}
                  >
                    {checkoutLoading === plano.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Comprar agora'
                    )}
                  </button>
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2"
                  >
                    Solicite uma demonstração
                  </button>
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

      {/* Modal Pré-Cadastro (mesmo da /planos) */}
      {modalPlano && (
        <PreCadastroModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          planoId={modalPlano.id}
          planoNome={modalPlano.nome}
          periodo={periodo}
          isTrial={modalPlano.isTrial}
          utms={{ utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' }}
          codigoParceiro=""
          onCheckout={handleCheckout}
        />
      )}

      {/* Modal Demonstração */}
      <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <span className="sr-only">Solicite uma demonstração</span>
          <div ref={demoContainerRef} className="min-h-[300px]" />
        </DialogContent>
      </Dialog>
    </section>
  )
}
