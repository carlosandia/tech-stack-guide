/**
 * AIDEV-NOTE: Edge Function pública que retorna configuração de formulário por slug
 * Usada pelo script embed dinâmico para renderizar formulários no DOM do site externo
 * Não requer autenticação - dados são públicos (config visual, campos, labels)
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro slug é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar formulário publicado pelo slug
    const { data: formulario, error: formError } = await supabaseAdmin
      .from('formularios')
      .select('id, nome, descricao, slug, tipo, config_botoes, config_pos_envio, lgpd_ativo, lgpd_texto_consentimento, lgpd_url_politica, lgpd_checkbox_obrigatorio, mensagem_sucesso, url_redirecionamento, redirecionar_apos_envio, titulo_pagina, tipo_botao_envio, whatsapp_numero, whatsapp_mensagem_template, organizacao_id')
      .eq('slug', slug)
      .eq('status', 'publicado')
      .is('deletado_em', null)
      .single()

    if (formError || !formulario) {
      return new Response(
        JSON.stringify({ error: 'Formulário não encontrado ou não publicado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar campos do formulário (apenas campos visíveis, não layout puro)
    const { data: campos, error: camposError } = await supabaseAdmin
      .from('campos_formularios')
      .select('id, nome, label, tipo, obrigatorio, placeholder, ordem, opcoes, texto_ajuda, largura, etapa_numero, valor_padrao, validacoes, condicional_ativo, condicional_campo_id, condicional_operador, condicional_valor')
      .eq('formulario_id', formulario.id)
      .order('ordem', { ascending: true })

    if (camposError) {
      console.error('Erro ao buscar campos:', camposError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar campos do formulário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar estilos
    const { data: estilos } = await supabaseAdmin
      .from('estilos_formularios')
      .select('container, cabecalho, campos, botao, pagina')
      .eq('formulario_id', formulario.id)
      .single()

    // Montar resposta pública (sem dados internos)
    const response = {
      formulario: {
        id: formulario.id,
        nome: formulario.nome,
        descricao: formulario.descricao,
        tipo: formulario.tipo,
        titulo_pagina: formulario.titulo_pagina,
        config_botoes: formulario.config_botoes,
        config_pos_envio: formulario.config_pos_envio,
        mensagem_sucesso: formulario.mensagem_sucesso,
        url_redirecionamento: formulario.url_redirecionamento,
        redirecionar_apos_envio: formulario.redirecionar_apos_envio,
        tipo_botao_envio: formulario.tipo_botao_envio,
        whatsapp_numero: formulario.whatsapp_numero,
        whatsapp_mensagem_template: formulario.whatsapp_mensagem_template,
        lgpd_ativo: formulario.lgpd_ativo,
        lgpd_texto_consentimento: formulario.lgpd_texto_consentimento,
        lgpd_url_politica: formulario.lgpd_url_politica,
        lgpd_checkbox_obrigatorio: formulario.lgpd_checkbox_obrigatorio,
      },
      campos: campos || [],
      estilos: estilos || null,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    })
  } catch (err) {
    console.error('Erro widget-formulario-config:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
