/**
 * AIDEV-NOTE: Edge Function para enviar evento de teste real à Meta Conversions API
 * Conforme PRD-08 - Busca pixel_id e access_token no banco, envia evento Lead de teste
 * e atualiza o resultado (sucesso/falha) na tabela config_conversions_api
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Cliente autenticado para obter claims do usuário
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub

    // Cliente com service role para acessar dados sensíveis (access_token)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Buscar organizacao_id do usuário
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('organizacao_id')
      .eq('auth_id', userId)
      .maybeSingle()

    if (userError || !usuario?.organizacao_id) {
      return new Response(JSON.stringify({ error: 'Organização não encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const orgId = usuario.organizacao_id

    // Buscar pixel_id da config CAPI
    const { data: capiConfig, error: capiError } = await supabaseAdmin
      .from('config_conversions_api')
      .select('pixel_id')
      .eq('organizacao_id', orgId)
      .maybeSingle()

    if (capiError || !capiConfig?.pixel_id) {
      return new Response(JSON.stringify({ error: 'Pixel ID não configurado. Salve a configuração CAPI primeiro.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Buscar access_token da conexão Meta
    const { data: conexaoMeta, error: metaError } = await supabaseAdmin
      .from('conexoes_meta')
      .select('access_token_encrypted')
      .eq('organizacao_id', orgId)
      .in('status', ['ativo', 'conectado'])
      .maybeSingle()

    if (metaError || !conexaoMeta?.access_token_encrypted) {
      return new Response(JSON.stringify({
        error: 'Conexão Meta não encontrada ou inativa. Reconecte sua conta Meta nas configurações.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = conexaoMeta.access_token_encrypted
    const pixelId = capiConfig.pixel_id
    const eventTime = Math.floor(Date.now() / 1000)
    const testEventCode = `TEST_EVENT_${eventTime}`

    // Enviar evento de teste para Meta CAPI
    const capiPayload = {
      data: [
        {
          event_name: 'Lead',
          event_time: eventTime,
          action_source: 'system_generated',
          user_data: { client_ip_address: '0.0.0.0' },
        },
      ],
      test_event_code: testEventCode,
    }

    console.log(`[test-capi-event] Enviando evento teste para pixel ${pixelId}`)

    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capiPayload),
      }
    )

    const metaResult = await metaResponse.json()
    const sucesso = metaResponse.ok && metaResult.events_received > 0

    console.log(`[test-capi-event] Resultado: ${sucesso ? 'sucesso' : 'falha'}`, JSON.stringify(metaResult))

    // Atualizar resultado do teste no banco
    await supabaseAdmin
      .from('config_conversions_api')
      .update({
        ultimo_teste: new Date().toISOString(),
        ultimo_teste_sucesso: sucesso,
        atualizado_em: new Date().toISOString(),
      })
      .eq('organizacao_id', orgId)

    if (sucesso) {
      return new Response(JSON.stringify({
        sucesso: true,
        events_received: metaResult.events_received,
        test_event_code: testEventCode,
        mensagem: `Evento de teste enviado com sucesso! Use o código "${testEventCode}" no Gerenciador de Eventos do Meta para verificar.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const metaError = metaResult.error || {}
      let errorMsg = metaError.error_user_msg || metaError.message || 'Erro desconhecido ao enviar evento'
      
      // AIDEV-NOTE: Detectar quando o Pixel ID é inválido (provavelmente é o Ad Account ID)
      if (metaError.code === 100 || errorMsg.includes('does not exist') || errorMsg.includes('does not support this operation')) {
        errorMsg = `O Pixel ID "${pixelId}" não é válido. Verifique se você inseriu o ID do Pixel (encontrado em Meta Events Manager > Data Sources) e não o ID da Conta de Anúncios. O Pixel ID correto pode ser encontrado em: https://business.facebook.com/events_manager`
      }
      
      return new Response(JSON.stringify({
        sucesso: false,
        erro: errorMsg,
        detalhes: metaResult,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (err) {
    console.error('[test-capi-event] Erro inesperado:', err)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
