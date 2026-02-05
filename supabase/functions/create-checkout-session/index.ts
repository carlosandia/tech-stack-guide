 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
 import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
 
 /**
  * AIDEV-NOTE: Edge Function para criar sessao de checkout do Stripe
  * Conforme PRD - Pagina de Planos com Stripe Checkout
  * 
  * Input: { plano_id, periodo, is_trial?, email?, utms? }
  * Output: { url: string }
  */
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 interface PlanoRow {
   id: string
   nome: string
   stripe_price_id_mensal: string | null
   stripe_price_id_anual: string | null
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
     const { plano_id, periodo = 'mensal', email, is_trial = false, utms } = body
 
     console.log('Creating checkout session:', { plano_id, periodo, email, is_trial })
 
     // Buscar plano
     const { data: plano, error: planoError } = await supabase
       .from('planos')
       .select('id, nome, stripe_price_id_mensal, stripe_price_id_anual')
       .eq('id', plano_id)
       .single() as { data: PlanoRow | null, error: Error | null }
 
     if (planoError || !plano) {
       console.error('Plano not found:', planoError)
       throw new Error('Plano nao encontrado')
     }
 
     // Determinar price_id baseado no periodo
     const priceId = periodo === 'anual' 
       ? plano.stripe_price_id_anual 
       : plano.stripe_price_id_mensal
 
     if (!priceId) {
       throw new Error(`Preco ${periodo} nao configurado para o plano ${plano.nome}`)
     }
 
     // Buscar configuração de trial se for trial
     let trialDias = 14
     if (is_trial) {
       const { data: trialConfig } = await supabase
         .from('configuracoes_globais')
         .select('configuracoes')
         .eq('plataforma', 'stripe')
         .single()
 
       if (trialConfig?.configuracoes) {
         const config = trialConfig.configuracoes as Record<string, unknown>
         trialDias = (config.trial_dias as number) || 14
       }
     }
 
     // Determinar URL base (origin)
     const origin = req.headers.get('origin') || 'https://crm.renovedigital.com.br'
 
     // Configurar sessão de checkout
     // deno-lint-ignore no-explicit-any
     const sessionParams: any = {
       mode: 'subscription',
       payment_method_types: ['card'],
       line_items: [
         {
           price: priceId,
           quantity: 1,
         },
       ],
       customer_email: email || undefined,
       success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
       cancel_url: `${origin}/planos`,
       allow_promotion_codes: true,
       billing_address_collection: 'required',
       metadata: {
         plano_id: plano.id,
         plano_nome: plano.nome,
         periodo,
         is_trial: is_trial ? 'true' : 'false',
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
 
     console.log('Checkout session created:', session.id)
 
     return new Response(
       JSON.stringify({ url: session.url }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       }
     )
   } catch (error: unknown) {
     console.error('Error creating checkout session:', error)
     const errorMessage = error instanceof Error ? error.message : 'Unknown error'
     return new Response(
       JSON.stringify({ error: errorMessage }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 400,
       }
     )
   }
 })