/**
 * AIDEV-NOTE: Edge Function para processar submissões de formulários
 * Cria contato e oportunidade no CRM com base nos mapeamentos de campos
 * Chamada fire-and-forget após inserção da submissão
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { submissao_id, formulario_id } = await req.json()

    if (!submissao_id || !formulario_id) {
      return new Response(JSON.stringify({ error: 'submissao_id e formulario_id são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Buscar formulário com config_botoes
    const { data: formulario, error: formErr } = await supabase
      .from('formularios')
      .select('id, organizacao_id, config_botoes, funil_id, etapa_destino_id')
      .eq('id', formulario_id)
      .single()

    if (formErr || !formulario) {
      console.error('Formulário não encontrado:', formErr)
      return new Response(JSON.stringify({ error: 'Formulário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Buscar submissão
    const { data: submissao, error: subErr } = await supabase
      .from('submissoes_formularios')
      .select('id, dados, utm_source, utm_medium, utm_campaign')
      .eq('id', submissao_id)
      .single()

    if (subErr || !submissao) {
      console.error('Submissão não encontrada:', subErr)
      return new Response(JSON.stringify({ error: 'Submissão não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar se deve criar oportunidade
    const configBotoes = (formulario.config_botoes && typeof formulario.config_botoes === 'object')
      ? formulario.config_botoes as Record<string, any>
      : null

    const deveCriarOportunidade =
      (formulario.funil_id) ||
      (configBotoes?.enviar_cria_oportunidade && configBotoes?.enviar_funil_id) ||
      (configBotoes?.whatsapp_cria_oportunidade && configBotoes?.whatsapp_funil_id)

    if (!deveCriarOportunidade) {
      // Marcar como processada sem criar oportunidade
      await supabase
        .from('submissoes_formularios')
        .update({ status: 'processada' })
        .eq('id', submissao_id)

      return new Response(JSON.stringify({ ok: true, mensagem: 'Sem integração configurada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const funilId = configBotoes?.enviar_funil_id || configBotoes?.whatsapp_funil_id || formulario.funil_id

    // Buscar mapeamento dos campos
    const { data: camposForm } = await supabase
      .from('campos_formularios')
      .select('nome, mapeamento_campo')
      .eq('formulario_id', formulario_id)
      .not('mapeamento_campo', 'is', null)

    if (!camposForm || camposForm.length === 0) {
      await supabase.from('submissoes_formularios').update({ status: 'processada' }).eq('id', submissao_id)
      return new Response(JSON.stringify({ ok: true, mensagem: 'Sem campos mapeados' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extrair dados mapeados
    const dados = submissao.dados as Record<string, any>
    const dadosContato: Record<string, any> = {}
    const dadosEmpresa: Record<string, any> = {}
    const dadosOportunidade: Record<string, any> = {}

    for (const campo of camposForm) {
      const valor = dados[campo.nome]
      if (valor === undefined || !campo.mapeamento_campo || campo.mapeamento_campo === 'nenhum') continue

      const mapeamento = campo.mapeamento_campo as string

      if (mapeamento.startsWith('contato.') || mapeamento.startsWith('pessoa.')) {
        const key = mapeamento.replace(/^(contato|pessoa)\./, '')
        dadosContato[key] = valor
      } else if (mapeamento.startsWith('empresa.')) {
        const key = mapeamento.replace('empresa.', '')
        dadosEmpresa[key] = valor
      } else if (mapeamento.startsWith('oportunidade.')) {
        const key = mapeamento.replace('oportunidade.', '')
        dadosOportunidade[key] = valor
      } else if (mapeamento.startsWith('custom.pessoa.')) {
        dadosContato[mapeamento] = valor
      } else if (mapeamento.startsWith('custom.empresa.')) {
        dadosEmpresa[mapeamento] = valor
      }
    }

    // Criar ou buscar contato
    let contatoId: string | null = null

    if (dadosContato.email || dadosContato.nome || dadosContato.telefone) {
      // Buscar contato existente pelo email
      if (dadosContato.email) {
        const { data: contatoExistente } = await supabase
          .from('contatos')
          .select('id')
          .eq('organizacao_id', formulario.organizacao_id)
          .eq('email', dadosContato.email)
          .is('deletado_em', null)
          .single()

        if (contatoExistente) {
          contatoId = contatoExistente.id
          // Atualizar dados (exceto campos custom.*)
          const dadosUpdate: Record<string, any> = {}
          for (const [k, v] of Object.entries(dadosContato)) {
            if (!k.startsWith('custom.')) dadosUpdate[k] = v
          }
          if (Object.keys(dadosUpdate).length > 0) {
            await supabase.from('contatos').update(dadosUpdate).eq('id', contatoId)
          }
        }
      }

      if (!contatoId) {
        // Criar novo contato
        const dadosInsert: Record<string, any> = {
          organizacao_id: formulario.organizacao_id,
          tipo: 'pessoa',
          origem: 'formulario',
        }
        for (const [k, v] of Object.entries(dadosContato)) {
          if (!k.startsWith('custom.')) dadosInsert[k] = v
        }

        const { data: novoContato } = await supabase
          .from('contatos')
          .insert(dadosInsert)
          .select('id')
          .single()

        contatoId = novoContato?.id || null
      }
    }

    // Criar oportunidade
    if (contatoId && funilId) {
      // Buscar etapa de entrada do funil
      const { data: etapaEntrada } = await supabase
        .from('etapas_funil')
        .select('id')
        .eq('funil_id', funilId)
        .eq('tipo', 'entrada')
        .is('deletado_em', null)
        .single()

      const etapaId = etapaEntrada?.id || formulario.etapa_destino_id

      // Gerar título no formato "[Nome] - #[Sequência]"
      const nomeContato = dadosContato.nome || 'Lead'
      const { count: countOportunidades } = await supabase
        .from('oportunidades')
        .select('id', { count: 'exact', head: true })
        .eq('contato_id', contatoId)
        .is('deletado_em', null)

      const sequencia = (countOportunidades || 0) + 1
      const tituloAuto = `${nomeContato} - #${sequencia}`

      const { data: oportunidade } = await supabase
        .from('oportunidades')
        .insert({
          organizacao_id: formulario.organizacao_id,
          funil_id: funilId,
          etapa_id: etapaId,
          contato_id: contatoId,
          titulo: tituloAuto,
          origem: 'formulario',
          valor: dadosOportunidade.valor || 0,
          utm_source: submissao.utm_source,
          utm_medium: submissao.utm_medium,
          utm_campaign: submissao.utm_campaign,
        })
        .select('id')
        .single()

      // Atualizar submissão com IDs
      if (oportunidade) {
        await supabase
          .from('submissoes_formularios')
          .update({
            contato_id: contatoId,
            oportunidade_id: oportunidade.id,
            status: 'processada',
          })
          .eq('id', submissao_id)
      }
    } else {
      await supabase
        .from('submissoes_formularios')
        .update({ status: 'processada' })
        .eq('id', submissao_id)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro ao processar submissão:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
