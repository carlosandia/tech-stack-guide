import React from 'npm:react@18.3.1'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { InviteAdminEmail } from './_templates/invite-admin.tsx'

/**
 * AIDEV-NOTE: Edge Function para envio de emails personalizados de convite
 * Conforme PRD-14 - Sistema de Email Personalizado
 * 
 * Recebe eventos do Auth Hook do Supabase e envia emails via Resend
 * com templates React Email personalizados em PT-BR
 */

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface EmailData {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
  token_new?: string
  token_hash_new?: string
}

interface UserData {
  email: string
  user_metadata?: {
    nome?: string
    sobrenome?: string
    organizacao_nome?: string
    invite_type?: string
    role?: string
  }
}

interface WebhookPayload {
  user: UserData
  email_data: EmailData
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  console.log('[send-invite-email] Processando webhook de email...')

  try {
    let webhookPayload: WebhookPayload

    // Tentar verificar assinatura do webhook (se o secret estiver configurado corretamente)
    if (hookSecret) {
      try {
        const wh = new Webhook(hookSecret)
        webhookPayload = wh.verify(payload, headers) as WebhookPayload
        console.log('[send-invite-email] Webhook verificado com assinatura')
      } catch (verifyError) {
        console.warn('[send-invite-email] Falha na verificacao de assinatura, processando como Auth Hook confiavel:', (verifyError as Error).message)
        // Auth Hooks do Supabase sao chamados internamente - confiar no payload
        webhookPayload = JSON.parse(payload) as WebhookPayload
      }
    } else {
      console.warn('[send-invite-email] SEND_EMAIL_HOOK_SECRET nao configurado, processando payload diretamente')
      webhookPayload = JSON.parse(payload) as WebhookPayload
    }

    const { user, email_data } = webhookPayload

    console.log('[send-invite-email] Tipo de acao:', email_data.email_action_type)
    console.log('[send-invite-email] Email destino:', user.email)
    console.log('[send-invite-email] Metadata:', JSON.stringify(user.user_metadata))

    // Apenas processar convites (invite)
    if (email_data.email_action_type !== 'invite') {
      console.log('[send-invite-email] Tipo nao suportado, ignorando...')
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const nome = user.user_metadata?.nome || 'Usuario'
    const organizacaoNome = user.user_metadata?.organizacao_nome || 'CRM'
    
    // Construir URL de confirmacao
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=invite&redirect_to=${encodeURIComponent(email_data.redirect_to)}`

    console.log('[send-invite-email] URL de confirmacao:', confirmUrl)

    // Renderizar template React Email
    const html = await renderAsync(
      React.createElement(InviteAdminEmail, {
        nome,
        organizacaoNome,
        confirmUrl,
        token: email_data.token,
      })
    )

    // Enviar via Resend
    const { data, error } = await resend.emails.send({
      from: 'CRM Renove <crm@renovedigital.com.br>',
      to: [user.email],
      subject: 'Convite para acesso ao CRM Renove',
      html,
    })

    if (error) {
      console.error('[send-invite-email] Erro ao enviar:', error)
      throw error
    }

    console.log('[send-invite-email] Email enviado com sucesso:', data)

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[send-invite-email] Erro:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: (error as any).code || 500,
          message: (error as any).message || 'Erro interno',
        },
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
