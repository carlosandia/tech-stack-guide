/**
 * AIDEV-NOTE: Edge Function para processamento de SLA de rodízio
 * Chamada periodicamente via pg_cron para redistribuir oportunidades
 * que excederam o tempo de SLA configurado.
 *
 * Lógica:
 * 1. Busca configs com sla_ativo=true e modo='rodizio'
 * 2. Para cada config, busca oportunidades abertas com SLA estourado
 * 3. Conta redistribuições anteriores (motivo='sla')
 * 4. Se abaixo do limite: redistribui round-robin, registra histórico, reseta timer
 * 5. Se atingiu limite: aplica sla_acao_limite
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Buscar todas as configs com SLA ativo e modo rodízio
    const { data: configs, error: configError } = await supabase
      .from('configuracoes_distribuicao')
      .select('*')
      .eq('sla_ativo', true)
      .eq('modo', 'rodizio')

    if (configError) {
      console.error('Erro ao buscar configs:', configError.message)
      return new Response(JSON.stringify({ error: configError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma config SLA ativa', redistribuidas: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let totalRedistribuidas = 0
    const logs: string[] = []

    for (const config of configs) {
      const slaMinutos = config.sla_tempo_minutos || 30
      const maxRedist = config.sla_max_redistribuicoes || 3
      const acaoLimite = config.sla_acao_limite || 'manter_ultimo'

      // 2. Calcular timestamp limite
      const tempoLimite = new Date()
      tempoLimite.setMinutes(tempoLimite.getMinutes() - slaMinutos)

      // 3. Buscar oportunidades com SLA estourado (com OU sem responsável)
      const { data: oportunidades, error: opError } = await supabase
        .from('oportunidades')
        .select('id, usuario_responsavel_id, contato_id, titulo')
        .eq('organizacao_id', config.organizacao_id)
        .eq('funil_id', config.funil_id)
        .is('fechado_em', null)
        .is('deletado_em', null)
        .lt('atualizado_em', tempoLimite.toISOString())

      if (opError) {
        logs.push(`Funil ${config.funil_id}: erro ao buscar oportunidades: ${opError.message}`)
        continue
      }

      if (!oportunidades || oportunidades.length === 0) {
        continue
      }

      // 4. Buscar membros ativos do funil (sem ordenar por campo inexistente)
      const { data: membros, error: membrosError } = await supabase
        .from('funis_membros')
        .select('usuario_id')
        .eq('organizacao_id', config.organizacao_id)
        .eq('funil_id', config.funil_id)
        .eq('ativo', true)

      if (membrosError) {
        logs.push(`Funil ${config.funil_id}: erro ao buscar membros: ${membrosError.message}`)
        continue
      }

      if (!membros || membros.length === 0) {
        logs.push(`Funil ${config.funil_id}: sem membros ativos`)
        continue
      }

      const usuariosIds = membros.map((m) => m.usuario_id)
      let posicaoAtual = config.posicao_rodizio || 0

      for (const op of oportunidades) {
        // 5. Contar redistribuições anteriores por SLA
        const { count } = await supabase
          .from('historico_distribuicao')
          .select('*', { count: 'exact', head: true })
          .eq('oportunidade_id', op.id)
          .eq('motivo', 'sla')

        const redistAnterior = count || 0

        if (redistAnterior >= maxRedist) {
          // Atingiu limite — aplicar ação
          if (acaoLimite === 'desatribuir') {
            await supabase
              .from('oportunidades')
              .update({ usuario_responsavel_id: null, atualizado_em: new Date().toISOString() })
              .eq('id', op.id)
            logs.push(`Op ${op.id}: desatribuída (limite atingido)`)
          } else if (acaoLimite === 'retornar_admin') {
            const { data: admin } = await supabase
              .from('usuarios')
              .select('id')
              .eq('organizacao_id', config.organizacao_id)
              .eq('role', 'admin')
              .limit(1)
              .single()

            if (admin) {
              await supabase
                .from('oportunidades')
                .update({ usuario_responsavel_id: admin.id, atualizado_em: new Date().toISOString() })
                .eq('id', op.id)
              logs.push(`Op ${op.id}: retornada ao admin ${admin.id}`)
            }
          }
          // 'manter_ultimo' — reseta o timer
          if (acaoLimite === 'manter_ultimo') {
            await supabase
              .from('oportunidades')
              .update({ atualizado_em: new Date().toISOString() })
              .eq('id', op.id)
          }
          continue
        }

        // 6. Round-robin: calcular próximo membro (diferente do atual)
        const responsavelAtual = op.usuario_responsavel_id
        let tentativas = 0
        let proximoUsuarioId: string

        // Avançar posição do rodízio
        posicaoAtual = (posicaoAtual + 1) % usuariosIds.length
        proximoUsuarioId = usuariosIds[posicaoAtual]

        // Se o próximo é o mesmo que o atual, tentar o seguinte
        while (proximoUsuarioId === responsavelAtual && tentativas < usuariosIds.length - 1) {
          posicaoAtual = (posicaoAtual + 1) % usuariosIds.length
          proximoUsuarioId = usuariosIds[posicaoAtual]
          tentativas++
        }

        // Se só tem 1 membro e é o mesmo, apenas resetar timer
        if (proximoUsuarioId === responsavelAtual && usuariosIds.length <= 1) {
          await supabase
            .from('oportunidades')
            .update({ atualizado_em: new Date().toISOString() })
            .eq('id', op.id)
          logs.push(`Op ${op.id}: único membro, timer resetado`)
          continue
        }

        // 7. Atualizar oportunidade com novo responsável e resetar timer
        const { error: updateError } = await supabase
          .from('oportunidades')
          .update({
            usuario_responsavel_id: proximoUsuarioId,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', op.id)

        if (updateError) {
          logs.push(`Op ${op.id}: erro ao redistribuir: ${updateError.message}`)
          continue
        }

        // 8. Registrar no histórico
        await supabase.from('historico_distribuicao').insert({
          organizacao_id: config.organizacao_id,
          oportunidade_id: op.id,
          funil_id: config.funil_id,
          usuario_origem_id: responsavelAtual,
          usuario_destino_id: proximoUsuarioId,
          motivo: 'sla',
        })

        totalRedistribuidas++
        logs.push(`Op ${op.id}: ${responsavelAtual || 'null'} → ${proximoUsuarioId}`)
      }

      // 9. Atualizar posição do rodízio na config
      await supabase
        .from('configuracoes_distribuicao')
        .update({ posicao_rodizio: posicaoAtual, atualizado_em: new Date().toISOString() })
        .eq('id', config.id)
    }

    console.log(`SLA processado: ${totalRedistribuidas} redistribuídas`, logs)

    return new Response(
      JSON.stringify({ redistribuidas: totalRedistribuidas, logs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no processar-sla:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
