import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.14.0'
 
 /**
  * AIDEV-NOTE: Edge Function para buscar dados de uma sessão de checkout
  * Conforme PRD - Fluxo de Onboarding Pós-Checkout
  * 
  * Input: { session_id: string }
  * Output: { customer_email, plano_id, plano_nome, is_trial, periodo }
  */
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
     const { session_id } = body
 
      if (!session_id) {
        return new Response(
          JSON.stringify({ error: 'Campos obrigatórios não preenchidos' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
 
     console.log('Fetching checkout session:', session_id)
 
     // Buscar sessão do Stripe
     const session = await stripe.checkout.sessions.retrieve(session_id)
 
      if (!session) {
        console.error('Session not found:', session_id)
        throw new Error('Requisição inválida')
      }
 
     // Verificar se sessão é válida (paid ou trialing)
     if (session.payment_status !== 'paid' && session.status !== 'complete') {
       // Para trials, o payment_status pode ser 'no_payment_required'
        if (session.payment_status !== 'no_payment_required') {
          console.error('Payment not confirmed for session:', session_id)
          throw new Error('Requisição inválida')
        }
     }
 
     // Verificar se sessão já foi usada
     const { data: existing, error: existingError } = await supabase
       .from('checkout_sessions_pendentes')
       .select('status')
       .eq('stripe_session_id', session_id)
       .maybeSingle()
 
     if (existingError) {
       console.error('Error checking session:', existingError)
     }
 
      if (existing?.status === 'concluido') {
        console.warn('Session already used:', session_id)
        throw new Error('Requisição inválida')
      }
 
     // Registrar sessão se primeira vez
     if (!existing) {
       const { error: insertError } = await supabase
         .from('checkout_sessions_pendentes')
         .insert({
           stripe_session_id: session_id,
           customer_email: session.customer_email,
           plano_id: session.metadata?.plano_id || null,
           is_trial: session.metadata?.is_trial === 'true',
           status: 'pendente',
           metadata: session.metadata,
         })
 
       if (insertError) {
         console.error('Error registering session:', insertError)
       }
     }
 
     console.log('Session data retrieved successfully')
 
     return new Response(
       JSON.stringify({
         customer_email: session.customer_email,
         plano_id: session.metadata?.plano_id,
         plano_nome: session.metadata?.plano_nome,
         is_trial: session.metadata?.is_trial === 'true',
         periodo: session.metadata?.periodo || 'mensal',
       }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       }
     )
    } catch (error: unknown) {
      console.error('Error fetching checkout session:', error)
      return new Response(
        JSON.stringify({ error: 'Não foi possível processar a requisição' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
 })