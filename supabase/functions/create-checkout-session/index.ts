import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

/**
 * AIDEV-NOTE: Edge Function para criar sessao de checkout do Stripe
 * Conforme PRD - Pagina de Planos com Stripe Checkout
 * 
 * CHECKOUT DINÂMICO: Usa price_data para criar produtos ad-hoc no Stripe,
 * eliminando a necessidade de criar produtos manualmente no Stripe Dashboard.
 * 
 * Input: { plano_id, periodo, is_trial?, email?, utms? }
 * Output: { url: string }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface PlanoRow {
  id: string
  nome: string
  preco_mensal: number
  preco_anual: number | null
  moeda: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // deno-lint-ignore no-explicit-any
    const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const body = await req.json()
    const { plano_id, periodo = 'mensal', email, is_trial = false, utms, pre_cadastro_id } = body

    console.log('Creating checkout session:', { plano_id, periodo, email, is_trial, pre_cadastro_id })

    // Buscar código de parceiro do pré-cadastro (se houver)
    let codigoParceiro: string | null = null
    if (pre_cadastro_id) {
      const { data: preCadastro } = await supabase
        .from('pre_cadastros_saas')
        .select('codigo_parceiro')
        .eq('id', pre_cadastro_id)
        .maybeSingle()
      codigoParceiro = preCadastro?.codigo_parceiro || null
      if (codigoParceiro) console.log('Código de parceiro encontrado:', codigoParceiro)
    }

    // Buscar configuração de trial se for trial
    let trialDias = 14
    let billingPlanoId = plano_id

    if (is_trial) {
      const { data: trialConfig } = await supabase
        .from('configuracoes_globais')
        .select('configuracoes')
        .eq('plataforma', 'stripe')
        .single()

      if (trialConfig?.configuracoes) {
        const config = trialConfig.configuracoes as Record<string, unknown>
        trialDias = (config.trial_dias as number) || 14

        // Verificar se trial está habilitado
        if (config.trial_habilitado === false || config.trial_habilitado === 'false') {
          throw new Error('Trial não está disponível no momento')
        }
      }

      // Para trial: buscar o plano pago mais barato para usar como base de cobrança
      const { data: cheapestPlan, error: cheapError } = await supabase
        .from('planos')
        .select('id, nome, preco_mensal, preco_anual, moeda')
        .eq('ativo', true)
        .gt('preco_mensal', 0)
        .order('preco_mensal', { ascending: true })
        .limit(1)
        .single()

      if (cheapError || !cheapestPlan) {
        console.error('No paid plan found for trial:', cheapError)
        throw new Error('Nenhum plano pago encontrado para iniciar trial')
      }

      billingPlanoId = cheapestPlan.id
      console.log('Trial: using cheapest paid plan:', cheapestPlan.nome, 'Price:', cheapestPlan.preco_mensal)
    }

    // Buscar plano com dados completos (nome, precos, moeda)
    const { data: plano, error: planoError } = await supabase
      .from('planos')
      .select('id, nome, preco_mensal, preco_anual, moeda')
      .eq('id', billingPlanoId)
      .single() as { data: PlanoRow | null, error: Error | null }

    if (planoError || !plano) {
      console.error('Plano not found:', planoError)
      throw new Error('Requisição inválida')
    }

    console.log('Plano encontrado:', { nome: plano.nome, preco_mensal: plano.preco_mensal, preco_anual: plano.preco_anual, moeda: plano.moeda })

    // Determinar preco baseado no periodo
    const preco = periodo === 'anual' ? plano.preco_anual : plano.preco_mensal

    if (!preco || preco <= 0) {
      console.error(`Preco ${periodo} nao configurado para plano ${plano.nome}. Valor: ${preco}`)
      throw new Error('Requisição inválida')
    }

    // Converter para centavos (Stripe exige unit_amount em centavos)
    const unitAmount = Math.round(preco * 100)
    const currency = (plano.moeda || 'BRL').toLowerCase()
    const interval = periodo === 'anual' ? 'year' : 'month'
    const productName = is_trial 
      ? `${plano.nome} - Trial (${trialDias} dias grátis)`
      : `${plano.nome} - ${periodo === 'anual' ? 'Anual' : 'Mensal'}`

    console.log('price_data:', { productName, unitAmount, currency, interval })

    // Determinar URL base (origin)
    const origin = req.headers.get('origin') || 'https://crm.renovedigital.com.br'

    // Configurar sessão de checkout com price_data dinâmico
    // deno-lint-ignore no-explicit-any
    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
            recurring: {
              interval,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planos`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        plano_id: is_trial ? plano_id : plano.id,
        billing_plano_id: plano.id,
        plano_nome: plano.nome,
        periodo,
        is_trial: is_trial ? 'true' : 'false',
        trial_dias: is_trial ? String(trialDias) : '0',
        pre_cadastro_id: pre_cadastro_id || '',
        codigo_parceiro: codigoParceiro || '',
        utm_source: utms?.utm_source || '',
        utm_medium: utms?.utm_medium || '',
        utm_campaign: utms?.utm_campaign || '',
        utm_term: utms?.utm_term || '',
        utm_content: utms?.utm_content || '',
      },
    }

    // Se for trial, adiciona período de teste
    if (is_trial) {
      sessionParams.subscription_data = {
        trial_period_days: trialDias,
      }
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log('Checkout session created:', session.id, '| Product:', productName, '| Amount:', unitAmount, currency)

    // Atualizar pré-cadastro com stripe_session_id e status
    if (pre_cadastro_id) {
      await supabase
        .from('pre_cadastros_saas')
        .update({
          status: 'checkout_iniciado',
          stripe_session_id: session.id,
        })
        .eq('id', pre_cadastro_id)
      console.log('Pre-cadastro atualizado:', pre_cadastro_id)
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Não foi possível processar a requisição' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
