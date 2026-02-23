import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertCircle, Check, Star, Users, HardDrive, Briefcase } from 'lucide-react'
import renoveLogo from '@/assets/logotipo-renove.svg'
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
  organizacao: { nome: string } | null
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
      // Validar parceiro
      const { data: parceiroData } = await supabase
        .from('parceiros')
        .select('id, codigo_indicacao, organizacao:organizacoes_saas(nome)')
        .eq('codigo_indicacao', codigo!.toUpperCase())
        .eq('status', 'ativo')
        .maybeSingle()

      if (!parceiroData) {
        setParceiroInvalido(true)
        return
      }
      setParceiro(parceiroData)

      // Buscar planos pagos (sem trial)
      const { data: planosData } = await supabase
        .from('planos')
        .select('id, nome, descricao, preco_mensal, preco_anual, limite_usuarios, limite_oportunidades, limite_storage_mb, ativo, ordem, popular')
        .eq('ativo', true)
        .eq('visivel', true)
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={renoveLogo} alt="CRM Renove" className="h-8" />
            </div>
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero com contexto do parceiro */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full mb-4">
            <Star className="w-3.5 h-3.5" />
            Indicado por {parceiro?.organizacao?.nome}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Escolha o plano ideal para seu negócio
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Você foi indicado por <strong>{parceiro?.organizacao?.nome}</strong>. Cancele quando quiser.
          </p>

          {/* Toggle Período */}
          <div className="inline-flex items-center gap-3 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setPeriodo('mensal')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                periodo === 'mensal' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                periodo === 'anual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              {descontoMedio && descontoMedio > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-primary">-{descontoMedio}%</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Planos Grid */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {planos.map((plano) => {
              const preco = periodo === 'anual' ? plano.preco_anual : plano.preco_mensal
              const precoAnualMensal = plano.preco_anual ? plano.preco_anual / 12 : null
              const isLoading = checkoutLoading === plano.id

              return (
                <div
                  key={plano.id}
                  className={`relative bg-card rounded-xl border p-6 flex flex-col ${
                    plano.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
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
                    <h3 className="text-lg font-semibold text-foreground">{plano.nome}</h3>
                    {plano.descricao && (
                      <p className="text-xs text-muted-foreground mt-1">{plano.descricao}</p>
                    )}
                    <div className="mt-3">
                      {preco ? (
                        <>
                          <span className="text-3xl font-bold text-primary">{formatPrice(preco)}</span>
                          <span className="text-sm text-muted-foreground ml-1">
                            {periodo === 'anual' ? '/ano' : '/mês'}
                          </span>
                          {periodo === 'anual' && precoAnualMensal && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatPrice(precoAnualMensal)}/mês
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-foreground">Sob consulta</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      {formatLimit(plano.limite_usuarios)} usuários
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HardDrive className="w-4 h-4 text-primary shrink-0" />
                      {formatStorage(plano.limite_storage_mb)} storage
                    </li>
                    {plano.limite_oportunidades && (
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        : 'border border-border text-foreground hover:bg-accent'
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
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 CRM Renove. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default ParceiroPage
