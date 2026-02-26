import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertCircle, Check, ShieldCheck, Users, HardDrive, Briefcase } from 'lucide-react'
import { LogoRenove } from '@/components/LogoRenove'
import { supabase } from '@/lib/supabase'
import { PreCadastroModal } from '../components/PreCadastroModal'

/**
 * AIDEV-NOTE: Pagina publica de indicacao de parceiro
 * URL: /parceiro/:codigo
 * Valida o codigo de indicacao, exibe planos com codigo pre-aplicado.
 * Ao contratar, indicacoes_parceiro e criada automaticamente.
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
  ativo: boolean | null
  ordem: number | null
  popular: boolean | null
}

interface Parceiro {
  id: string
  codigo_indicacao: string
  organizacao_nome: string | null
}

export function ParceiroPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const [parceiro, setParceiro] = useState<Parceiro | null>(null)
  const [planos, setPlanos] = useState<PlanoDb[]>([])
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')
  const [loading, setLoading] = useState(true)
  const [parceiroInvalido, setParceiroInvalido] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPlano, setModalPlano] = useState<{ id: string; nome: string } | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!codigo) {
      setParceiroInvalido(true)
      setLoading(false)
      return
    }
    carregarDados()
  }, [codigo])

  const carregarDados = async () => {
    try {
      // Validar parceiro via RPC SECURITY DEFINER (acessível por anon)
      const { data: parceiroData, error: parceiroError } = await supabase
        .rpc('validate_partner_code', { p_codigo: codigo!.toUpperCase() })

      if (parceiroError || !parceiroData || parceiroData.length === 0) {
        setParceiroInvalido(true)
        return
      }
      setParceiro(parceiroData[0])

      // Buscar planos pagos (sem trial)
      const { data: planosData } = await supabase
        .from('planos')
        .select('id, nome, descricao, preco_mensal, preco_anual, limite_usuarios, limite_oportunidades, limite_storage_mb, ativo, ordem, popular')
        .eq('ativo', true)
        .eq('visivel_parceiros', true)
        .gt('preco_mensal', 0)
        .order('ordem', { ascending: true })

      setPlanos(planosData || [])
    } catch (err) {
      console.error('Error loading parceiro page:', err)
      setParceiroInvalido(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (preCadastroId: string) => {
    setModalOpen(false)
    if (!modalPlano) return

    setCheckoutLoading(modalPlano.id)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plano_id: modalPlano.id,
          periodo,
          is_trial: false,
          pre_cadastro_id: preCadastroId,
          utms: {},
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(price)

  const formatStorage = (mb: number | null) => {
    if (!mb) return 'Ilimitado'
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`
    return `${mb}MB`
  }

  const formatLimit = (limit: number | null) => {
    if (!limit || limit >= 999999) return 'Ilimitado'
    return limit.toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (parceiroInvalido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Link de indicação inválido</h1>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Este link de indicação expirou, foi desativado ou não existe.
          Você ainda pode contratar um plano normalmente.
        </p>
        <Link
          to="/planos"
          className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Ver planos disponíveis
        </Link>
      </div>
    )
  }

  const descontoMedio = (() => {
    const planosComAnual = planos.filter(p => p.preco_mensal && p.preco_mensal > 0 && p.preco_anual && p.preco_anual > 0)
    if (!planosComAnual.length) return null
    return Math.round(
      planosComAnual.reduce((acc, p) => {
        const mensalAnualizado = (p.preco_mensal ?? 0) * 12
        const anual = p.preco_anual ?? 0
        return acc + ((mensalAnualizado - anual) / mensalAnualizado) * 100
      }, 0) / planosComAnual.length
    )
  })()

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header premium — glassmorphism minimalista */}
      <header className="bg-white/[0.03] backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-3">
                <LogoRenove className="h-7 sm:h-8" forceWhite />
                <div className="hidden sm:block h-4 w-px bg-white/20" />
                <span className="hidden sm:inline text-sm font-medium text-slate-400 tracking-wide">Programa de Parceiros</span>
              </div>
            {parceiro?.organizacao_nome && (
                <div className="flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-medium text-slate-300">Programa de Parceiros</span>
                </div>
              )}
            </div>
            {parceiro?.organizacao_nome && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-slate-300">Parceiro Certificado</span>
              </div>
            )}
          </div>
        </div>
        {/* Linha de brilho sutil no bottom */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </header>

      {/* Hero premium — sempre dark nesta página */}
      <section className="py-10 sm:py-16 px-4 relative overflow-hidden">
        {/* Gradientes premium empilhados */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15)_0%,transparent_60%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          {/* Título principal — primeiro, hierarquia clara */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 animate-fade-in leading-tight">
            Condições exclusivas via <span className="text-primary">{parceiro?.organizacao_nome}</span>.
            <br />
            Escolha seu plano ideal.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 mb-5 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            Vantagens especiais garantidas pelo seu parceiro. Comece agora, cancele quando quiser.
          </p>

          {/* Toggle Período */}
          <div className="inline-flex items-center p-1 bg-white/[0.07] rounded-lg border border-white/10 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <button
              onClick={() => setPeriodo('mensal')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                periodo === 'mensal'
                  ? 'bg-white/15 text-white shadow-sm shadow-black/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                periodo === 'anual'
                  ? 'bg-white/15 text-white shadow-sm shadow-black/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Anual
              {descontoMedio && descontoMedio > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-emerald-400">-{descontoMedio}%</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Planos Grid */}
      <section className="pb-12 px-4 -mt-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {planos.map((plano) => {
              const preco = periodo === 'anual' ? plano.preco_anual : plano.preco_mensal
              const precoAnualMensal = plano.preco_anual ? plano.preco_anual / 12 : null
              const isLoading = checkoutLoading === plano.id

              return (
                <div
                  key={plano.id}
                  className={`relative bg-[#1E293B] rounded-xl border p-6 flex flex-col w-full ${
                    plano.popular ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10'
                  }`}
                >
                  {plano.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white">{plano.nome}</h3>
                    {plano.descricao && (
                      <p className="text-xs text-slate-400 mt-1">{plano.descricao}</p>
                    )}
                    <div className="mt-3">
                      {preco ? (
                        <>
                          <span className="text-3xl font-bold text-primary">{formatPrice(preco)}</span>
                          <span className="text-sm text-slate-400 ml-1">
                            {periodo === 'anual' ? '/ano' : '/mês'}
                          </span>
                          {periodo === 'anual' && precoAnualMensal && (
                            <p className="text-xs text-slate-500 mt-1">
                              {formatPrice(precoAnualMensal)}/mês
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-white">Sob consulta</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    <li className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      {formatLimit(plano.limite_usuarios)} usuários
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-400">
                      <HardDrive className="w-4 h-4 text-primary shrink-0" />
                      {formatStorage(plano.limite_storage_mb)} storage
                    </li>
                    {plano.limite_oportunidades && (
                      <li className="flex items-center gap-2 text-sm text-slate-400">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        {formatLimit(plano.limite_oportunidades)} oportunidades
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => {
                      setModalPlano({ id: plano.id, nome: plano.nome })
                      setModalOpen(true)
                    }}
                    disabled={isLoading}
                    className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      plano.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Assinar {plano.nome}
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Modal Pré-Cadastro */}
      {modalPlano && (
        <PreCadastroModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          planoId={modalPlano.id}
          planoNome={modalPlano.nome}
          periodo={periodo}
          isTrial={false}
          utms={{}}
          codigoParceiro={codigo?.toUpperCase()}
          onCheckout={handleCheckout}
        />
      )}

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CRM Renove. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default ParceiroPage
