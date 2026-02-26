/**
 * AIDEV-NOTE: Service API para Pré-Oportunidades (RF-11)
 * Leads vindos do WhatsApp que precisam de triagem
 * Coluna "Solicitações" no Kanban
 */

import { supabase } from '@/lib/supabase'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'

// AIDEV-NOTE: Heurística para detectar LIDs do WhatsApp (não são telefones reais)
// LIDs são tipicamente > 14 dígitos e não começam com prefixos de país comuns
function isLikelyLid(phone: string): boolean {
  const clean = phone.replace(/\D/g, '')
  return clean.length > 14
}

// =====================================================
// Types
// =====================================================

export interface PreOportunidade {
  id: string
  organizacao_id: string
  integracao_id: string | null
  phone_number: string
  phone_name: string | null
  profile_picture_url: string | null
  funil_destino_id: string
  status: 'pendente' | 'aceito' | 'rejeitado'
  oportunidade_id: string | null
  processado_por: string | null
  processado_em: string | null
  motivo_rejeicao: string | null
  primeira_mensagem: string | null
  primeira_mensagem_em: string | null
  ultima_mensagem: string | null
  ultima_mensagem_em: string | null
  total_mensagens: number
  criado_em: string
  atualizado_em: string
}

export interface PreOportunidadeCard {
  id: string
  phone_number: string
  phone_name: string | null
  profile_picture_url: string | null
  primeira_mensagem: string | null
  ultima_mensagem: string | null
  total_mensagens: number
  criado_em: string
  ultima_mensagem_em: string | null
  tempo_espera_minutos: number
}

// =====================================================
// API
// =====================================================

export const preOportunidadesApi = {
  /**
   * Listar pré-oportunidades pendentes para um funil (cards da coluna Solicitações)
   */
  listarPendentes: async (funilId: string): Promise<PreOportunidadeCard[]> => {
    const { data, error } = await supabase
      .from('pre_oportunidades')
      .select('id, phone_number, phone_name, profile_picture_url, primeira_mensagem, ultima_mensagem, total_mensagens, criado_em, ultima_mensagem_em')
      .eq('funil_destino_id', funilId)
      .eq('status', 'pendente')
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)

    const agora = Date.now()
    const items = (data || []).map(item => ({
      ...item,
      total_mensagens: item.total_mensagens ?? 0,
      tempo_espera_minutos: Math.round(
        (agora - new Date(item.criado_em).getTime()) / 60000
      ),
    }))

    // AIDEV-NOTE: Buscar fotos de perfil das conversas para pré-oportunidades sem foto
    const semFoto = items.filter(i => !i.profile_picture_url)
    if (semFoto.length > 0) {
      const phones = semFoto.map(i => `${i.phone_number}@c.us`)
      const { data: conversas } = await supabase
        .from('conversas')
        .select('chat_id, foto_url')
        .in('chat_id', phones)
        .not('foto_url', 'is', null)

      if (conversas && conversas.length > 0) {
        const fotoMap = new Map(conversas.map(c => [c.chat_id.replace('@c.us', ''), c.foto_url]))
        for (const item of items) {
          if (!item.profile_picture_url) {
            item.profile_picture_url = fotoMap.get(item.phone_number) || null
          }
        }
      }
    }

    // AIDEV-NOTE: Para pré-ops sem phone_name (possivelmente LIDs), resolver nome via RPC + contatos
    const semNome = items.filter(i => !i.phone_name && isLikelyLid(i.phone_number))
    if (semNome.length > 0) {
      try {
        const organizacaoId = await getOrganizacaoId()
        for (const item of semNome) {
          // Usar RPC resolve_lid_conversa para encontrar a conversa real
          const { data: rpcResult } = await supabase
            .rpc('resolve_lid_conversa', {
              p_org_id: organizacaoId,
              p_lid_number: item.phone_number,
            })

          if (rpcResult && rpcResult.length > 0) {
            const conversaId = rpcResult[0].conversa_id
            // Buscar conversa com contato para pegar nome e foto
            const { data: conv } = await supabase
              .from('conversas')
              .select('contato_id, foto_url, contato:contatos!conversas_contato_id_fkey(id, nome, nome_fantasia, telefone)')
              .eq('id', conversaId)
              .maybeSingle()

            if (conv) {
              const contato = conv.contato as any
              if (contato?.nome) {
                item.phone_name = contato.nome
              }
              if (contato?.telefone) {
                // Corrigir phone_number no objeto local para exibição
                item.phone_number = contato.telefone
              }
              if (!item.profile_picture_url && conv.foto_url) {
                item.profile_picture_url = conv.foto_url
              }
            }
          }
        }
      } catch (err) {
        console.error('[pre-oportunidades] Erro ao resolver LIDs:', err)
      }
    }

    return items
  },

  /**
   * Contar pré-oportunidades pendentes para badge
   */
  contarPendentes: async (funilId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('pre_oportunidades')
      .select('id', { count: 'exact', head: true })
      .eq('funil_destino_id', funilId)
      .eq('status', 'pendente')
      .is('deletado_em', null)

    if (error) throw new Error(error.message)
    return count || 0
  },

  /**
   * Aceitar pré-oportunidade → criar oportunidade
   */
  aceitar: async (preOpId: string, payload: {
    titulo?: string
    etapa_id?: string
    usuario_responsavel_id?: string
    valor?: number
    contato_nome?: string
    contato_email?: string
    contato_existente_id?: string
  }): Promise<{ oportunidade_id: string }> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // 1. Buscar pré-oportunidade
    const { data: preOp, error: preOpError } = await supabase
      .from('pre_oportunidades')
      .select('*')
      .eq('id', preOpId)
      .single()

    if (preOpError || !preOp) throw new Error('Pré-oportunidade não encontrada')
    if (preOp.status !== 'pendente') throw new Error('Pré-oportunidade já foi processada')

    // 2. Criar ou vincular contato
    let contatoId = payload.contato_existente_id

    if (!contatoId) {
      // Buscar contato pré-existente pelo telefone (pode ser pre_lead do webhook)
      const { data: contatoExistente } = await supabase
        .from('contatos')
        .select('id, status')
        .eq('organizacao_id', organizacaoId)
        .eq('telefone', preOp.phone_number)
        .is('deletado_em', null)
        .maybeSingle()

      if (contatoExistente) {
        contatoId = contatoExistente.id
        // Se era pre_lead, promover para novo
        if (contatoExistente.status === 'pre_lead') {
          await supabase
            .from('contatos')
            .update({
              status: 'novo',
              nome: payload.contato_nome || preOp.phone_name || preOp.phone_number,
              email: payload.contato_email || null,
            } as any)
            .eq('id', contatoId)
        }
      } else {
        const { data: novoContato, error: contatoError } = await supabase
          .from('contatos')
          .insert({
            organizacao_id: organizacaoId,
            tipo: 'pessoa',
            nome: payload.contato_nome || preOp.phone_name || preOp.phone_number,
            telefone: preOp.phone_number,
            email: payload.contato_email || null,
            origem: 'whatsapp',
            criado_por: userId,
          } as any)
          .select('id')
          .single()

        if (contatoError) throw new Error(contatoError.message)
        contatoId = novoContato.id
      }
    }

    // 3. Buscar etapa de entrada se não informada
    let etapaId = payload.etapa_id
    if (!etapaId) {
      const { data: etapaEntrada } = await supabase
        .from('etapas_funil')
        .select('id')
        .eq('funil_id', preOp.funil_destino_id)
        .eq('tipo', 'entrada')
        .is('deletado_em', null)
        .maybeSingle()

      etapaId = etapaEntrada?.id
      if (!etapaId) {
        const { data: primeiraEtapa } = await supabase
          .from('etapas_funil')
          .select('id')
          .eq('funil_id', preOp.funil_destino_id)
          .is('deletado_em', null)
          .order('ordem', { ascending: true })
          .limit(1)
          .maybeSingle()
        etapaId = primeiraEtapa?.id || ''
      }
    }

    // 4. Criar oportunidade
    const { data: novaOp, error: opError } = await supabase
      .from('oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        funil_id: preOp.funil_destino_id,
        etapa_id: etapaId,
        contato_id: contatoId,
        titulo: payload.titulo || preOp.phone_name || preOp.phone_number,
        valor: payload.valor || null,
        usuario_responsavel_id: payload.usuario_responsavel_id || userId,
        criado_por: userId,
        // AIDEV-NOTE: utm_source 'whatsapp' para pré-oportunidades aceitas do WhatsApp
        utm_source: 'whatsapp',
      } as any)
      .select('id')
      .single()

    if (opError) throw new Error(opError.message)

    // 5. Atualizar pré-oportunidade
    await supabase
      .from('pre_oportunidades')
      .update({
        status: 'aceito',
        oportunidade_id: novaOp.id,
        processado_por: userId,
        processado_em: new Date().toISOString(),
      } as any)
      .eq('id', preOpId)

    return { oportunidade_id: novaOp.id }
  },

  /**
   * Rejeitar pré-oportunidade (motivo opcional, com opção de bloqueio)
   */
  rejeitar: async (preOpId: string, payload: {
    motivo?: string
    bloquear?: boolean
    phoneNumber?: string
    phoneName?: string
  }): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data: preOp } = await supabase
      .from('pre_oportunidades')
      .select('status, phone_number, phone_name')
      .eq('id', preOpId)
      .single()

    if (!preOp) throw new Error('Pré-oportunidade não encontrada')
    if (preOp.status !== 'pendente') throw new Error('Pré-oportunidade já foi processada')

    const { error } = await supabase
      .from('pre_oportunidades')
      .update({
        status: 'rejeitado',
        motivo_rejeicao: payload.motivo || null,
        processado_por: userId,
        processado_em: new Date().toISOString(),
      } as any)
      .eq('id', preOpId)

    if (error) throw new Error(error.message)

    // Bloquear contato se solicitado
    if (payload.bloquear) {
      const phone = payload.phoneNumber || preOp.phone_number
      const { error: blockError } = await supabase
        .from('contatos_bloqueados_pre_op')
        .upsert({
          organizacao_id: organizacaoId,
          phone_number: phone,
          phone_name: payload.phoneName || preOp.phone_name || null,
          motivo: payload.motivo || null,
          bloqueado_por: userId,
        } as any, { onConflict: 'organizacao_id,phone_number' })

      if (blockError) console.error('Erro ao bloquear contato:', blockError)
    }
  },

  /**
   * Listar contatos bloqueados da organização
   */
  listarBloqueados: async () => {
    const { data, error } = await supabase
      .from('contatos_bloqueados_pre_op')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Desbloquear contato (remover do bloqueio)
   */
  desbloquearContato: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('contatos_bloqueados_pre_op')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Preferências de Métricas (persistência no banco)
  // =====================================================

  buscarPreferenciasMetricas: async (funilId: string): Promise<string[] | null> => {
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('preferencias_metricas')
      .select('metricas_visiveis')
      .eq('funil_id', funilId)
      .eq('usuario_id', userId)
      .maybeSingle()

    if (error) return null
    return data?.metricas_visiveis || null
  },

  salvarPreferenciasMetricas: async (funilId: string, metricasVisiveis: string[]): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data: existing } = await supabase
      .from('preferencias_metricas')
      .select('id')
      .eq('funil_id', funilId)
      .eq('usuario_id', userId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('preferencias_metricas')
        .update({ metricas_visiveis: metricasVisiveis, atualizado_em: new Date().toISOString() } as any)
        .eq('id', existing.id)

      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('preferencias_metricas')
        .insert({
          organizacao_id: organizacaoId,
          usuario_id: userId,
          funil_id: funilId,
          metricas_visiveis: metricasVisiveis,
        } as any)

      if (error) throw new Error(error.message)
    }
  },
}
