/**
 * AIDEV-NOTE: Service API para Contatos e Segmentos
 * Usa Supabase client direto (respeita RLS)
 * Conforme PRD-06 - Modulo de Contatos
 *
 * Migrado de axios/Express para Supabase direto
 * RLS filtra automaticamente pelo tenant do usuario logado
 */

import { supabase } from '@/lib/supabase'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'

// =====================================================
// Types
// =====================================================

export type TipoContato = 'pessoa' | 'empresa'
export type StatusContato = 'novo' | 'lead' | 'mql' | 'sql' | 'cliente' | 'perdido'
export type OrigemContato = 'manual' | 'importacao' | 'formulario' | 'whatsapp' | 'instagram' | 'meta_ads' | 'indicacao' | 'outro'

export interface Contato {
  id: string
  organizacao_id: string
  tipo: TipoContato
  status: StatusContato
  origem: OrigemContato
  nome?: string | null
  sobrenome?: string | null
  email?: string | null
  telefone?: string | null
  cargo?: string | null
  empresa_id?: string | null
  linkedin_url?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  cnpj?: string | null
  website?: string | null
  segmento?: string | null
  porte?: string | null
  endereco_cep?: string | null
  endereco_logradouro?: string | null
  endereco_numero?: string | null
  endereco_complemento?: string | null
  endereco_bairro?: string | null
  endereco_cidade?: string | null
  endereco_estado?: string | null
  observacoes?: string | null
  owner_id?: string | null
  criado_por?: string | null
  criado_em: string
  atualizado_em: string
  deletado_em?: string | null
  // Campos enriquecidos
  empresa?: { id: string; razao_social?: string; nome_fantasia?: string } | null
  segmentos?: Array<{ id: string; nome: string; cor: string }>
  owner?: { nome: string; sobrenome?: string } | null
  total_oportunidades?: number
  pessoas?: Array<{ id: string; nome: string; sobrenome?: string; email?: string; telefone?: string; cargo?: string; status: string }>
  campos_customizados?: Record<string, unknown>
}

export interface Segmento {
  id: string
  organizacao_id: string
  nome: string
  cor: string
  descricao?: string | null
  total_contatos?: number
  criado_em: string
  atualizado_em: string
}

export interface ListaContatosResponse {
  contatos: Contato[]
  total: number
  page: number
  per_page: number
  total_paginas: number
}

export interface ListarContatosParams {
  tipo?: TipoContato
  status?: StatusContato
  origem?: OrigemContato
  owner_id?: string
  segmento_id?: string
  empresa_id?: string
  busca?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
  ordenar_por?: string
  ordem?: string
}

// =====================================================
// Helper - Colunas válidas da tabela contatos
// =====================================================

const CONTATOS_VALID_COLUMNS = new Set([
  'tipo', 'status', 'origem', 'nome', 'sobrenome', 'email', 'telefone',
  'cargo', 'empresa_id', 'linkedin_url', 'razao_social', 'nome_fantasia',
  'cnpj', 'website', 'segmento', 'porte', 'endereco_cep', 'endereco_logradouro',
  'endereco_numero', 'endereco_complemento', 'endereco_bairro', 'endereco_cidade',
  'endereco_estado', 'observacoes', 'owner_id', 'organizacao_id', 'criado_por',
])

function sanitizeContatoPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (CONTATOS_VALID_COLUMNS.has(key) && value !== undefined) {
      clean[key] = value
    }
  }
  return clean
}

// =====================================================
// API Contatos
// =====================================================

export const contatosApi = {
  listar: async (params?: ListarContatosParams): Promise<ListaContatosResponse> => {
    const page = params?.page || 1
    const perPage = params?.limit || 50
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    // Ordenação
    const ordenarPor = params?.ordenar_por || 'criado_em'
    const ordemAsc = params?.ordem === 'asc'

    // AIDEV-NOTE: Filtro de segmento pre-query para corrigir paginacao distorcida (Plano Escala)
    let idsDoSegmento: string[] | null = null
    if (params?.segmento_id) {
      const { data: segVinculos } = await supabase
        .from('contatos_segmentos')
        .select('contato_id')
        .eq('segmento_id', params.segmento_id)
      idsDoSegmento = (segVinculos || []).map(v => v.contato_id)
      if (idsDoSegmento.length === 0) {
        return { contatos: [], total: 0, page, per_page: perPage, total_paginas: 0 }
      }
    }

    let query = supabase
      .from('contatos')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)
      .neq('status', 'pre_lead')
      .order(ordenarPor, { ascending: ordemAsc })
      .range(from, to)

    // Aplicar filtro de segmento na query principal
    if (idsDoSegmento) {
      query = query.in('id', idsDoSegmento)
    }

    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.status) query = query.eq('status', params.status)
    if (params?.origem) query = query.eq('origem', params.origem)
    if (params?.owner_id) query = query.eq('owner_id', params.owner_id)
    if (params?.empresa_id) query = query.eq('empresa_id', params.empresa_id)
    if (params?.data_inicio) query = query.gte('criado_em', params.data_inicio)
    if (params?.data_fim) query = query.lte('criado_em', params.data_fim)

    if (params?.busca) {
      query = query.or(
        `nome.ilike.%${params.busca}%,sobrenome.ilike.%${params.busca}%,email.ilike.%${params.busca}%,telefone.ilike.%${params.busca}%,razao_social.ilike.%${params.busca}%,nome_fantasia.ilike.%${params.busca}%,cargo.ilike.%${params.busca}%,cnpj.ilike.%${params.busca}%`
      )
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    let contatos = (data || []) as Contato[]

    // AIDEV-NOTE: Promise.all paraleliza 6 queries de enriquecimento (antes eram sequenciais)
    if (contatos.length > 0) {
      const contatoIds = contatos.map(c => c.id)
      const ownerIds = [...new Set(contatos.filter(c => c.owner_id).map(c => c.owner_id!))]
      const tipoEntidade = params?.tipo === 'empresa' ? 'empresa' : 'pessoa'
      const empresaIdsDePessoas = params?.tipo === 'pessoa'
        ? [...new Set(contatos.filter(c => c.empresa_id).map(c => c.empresa_id!))]
        : []

      const [
        vinculosResult,
        ownersResult,
        tipoEnrichResult,
        camposDefsResult,
        valoresCustomResult,
        opsResult,
      ] = await Promise.all([
        // 1. segmentos
        supabase
          .from('contatos_segmentos')
          .select('contato_id, segmento_id, segmentos:segmento_id(id, nome, cor)')
          .in('contato_id', contatoIds),

        // 2. owners
        ownerIds.length > 0
          ? supabase.from('usuarios').select('id, nome, sobrenome').in('id', ownerIds)
          : Promise.resolve({ data: [] as { id: string; nome: string; sobrenome: string | null }[], error: null }),

        // 3. tipo-based enrichment (empresas para pessoas | pessoas para empresas)
        params?.tipo === 'pessoa' && empresaIdsDePessoas.length > 0
          ? supabase.from('contatos').select('id, razao_social, nome_fantasia').in('id', empresaIdsDePessoas)
          : params?.tipo === 'empresa'
            ? supabase.from('contatos')
                .select('id, nome, sobrenome, email, telefone, cargo, status, empresa_id')
                .in('empresa_id', contatoIds)
                .is('deletado_em', null)
            : Promise.resolve({ data: null as any, error: null }),

        // 4. definições dos campos customizados
        supabase.from('campos_customizados').select('id, slug, tipo').is('deletado_em', null),

        // 5. valores de campos customizados
        supabase
          .from('valores_campos_customizados')
          .select('entidade_id, campo_id, valor_texto, valor_numero, valor_data, valor_booleano, valor_json')
          .eq('entidade_tipo', tipoEntidade)
          .in('entidade_id', contatoIds),

        // 6. contagem de oportunidades
        supabase
          .from('oportunidades')
          .select('contato_id', { count: 'exact', head: false })
          .in('contato_id', contatoIds)
          .is('deletado_em', null),
      ])

      // Aplicar segmentos
      const vinculosData = vinculosResult.data
      if (vinculosData) {
        const segmentosByContato: Record<string, Array<{ id: string; nome: string; cor: string }>> = {}
        for (const v of vinculosData as any[]) {
          if (!segmentosByContato[v.contato_id]) segmentosByContato[v.contato_id] = []
          if (v.segmentos) {
            segmentosByContato[v.contato_id].push({
              id: v.segmentos.id,
              nome: v.segmentos.nome,
              cor: v.segmentos.cor,
            })
          }
        }
        contatos = contatos.map(c => ({
          ...c,
          segmentos: segmentosByContato[c.id] || [],
        }))
      }

      // Aplicar owners
      const ownersData = ownersResult.data
      if (ownersData && ownersData.length > 0) {
        const ownersMap: Record<string, { nome: string; sobrenome?: string }> = {}
        for (const o of ownersData) {
          ownersMap[o.id] = { nome: o.nome, sobrenome: o.sobrenome || undefined }
        }
        contatos = contatos.map(c => ({
          ...c,
          owner: c.owner_id ? ownersMap[c.owner_id] || null : null,
        }))
      }

      // Aplicar enrichment de tipo (empresas para pessoas | pessoas para empresas)
      const tipoEnrichData = tipoEnrichResult.data
      if (tipoEnrichData) {
        if (params?.tipo === 'pessoa') {
          const empresasMap: Record<string, { id: string; razao_social?: string; nome_fantasia?: string }> = {}
          for (const e of tipoEnrichData as any[]) {
            empresasMap[e.id] = { id: e.id, razao_social: e.razao_social || undefined, nome_fantasia: e.nome_fantasia || undefined }
          }
          contatos = contatos.map(c => ({
            ...c,
            empresa: c.empresa_id ? empresasMap[c.empresa_id] || null : null,
          }))
        } else if (params?.tipo === 'empresa') {
          const pessoasByEmpresa: Record<string, Array<{ id: string; nome: string; sobrenome?: string; email?: string; telefone?: string; cargo?: string; status: string }>> = {}
          for (const p of tipoEnrichData as any[]) {
            if (!p.empresa_id) continue
            if (!pessoasByEmpresa[p.empresa_id]) pessoasByEmpresa[p.empresa_id] = []
            pessoasByEmpresa[p.empresa_id].push({
              id: p.id,
              nome: p.nome || '',
              sobrenome: p.sobrenome || undefined,
              email: p.email || undefined,
              telefone: p.telefone || undefined,
              cargo: p.cargo || undefined,
              status: p.status,
            })
          }
          contatos = contatos.map(c => ({
            ...c,
            pessoas: pessoasByEmpresa[c.id] || [],
          }))
        }
      }

      // AIDEV-NOTE: Filtro de segmento movido para pre-query (Plano Escala 5.4)

      // Aplicar campos customizados
      {
        const camposDefs = camposDefsResult.data
        const valoresCustom = valoresCustomResult.data

        const slugMap = new Map<string, { slug: string; tipo: string }>()
        for (const cd of camposDefs || []) {
          slugMap.set(cd.id, { slug: cd.slug, tipo: cd.tipo })
        }

        if (valoresCustom) {
          const camposCustomMap: Record<string, Record<string, unknown>> = {}
          for (const vc of valoresCustom as any[]) {
            if (!camposCustomMap[vc.entidade_id]) camposCustomMap[vc.entidade_id] = {}
            const campoInfo = slugMap.get(vc.campo_id)
            if (!campoInfo) continue

            let displayValue: unknown = null
            const campoTipo = campoInfo.tipo
            if (vc.valor_json && Array.isArray(vc.valor_json)) {
              // Multi-select: usar pipe para preservar valores com vírgula
              displayValue = campoTipo === 'multi_select'
                ? (vc.valor_json as string[]).join(' | ')
                : (vc.valor_json as string[]).join(', ')
            } else if (vc.valor_texto && vc.valor_texto.includes('|')) {
              displayValue = campoTipo === 'multi_select'
                ? vc.valor_texto
                : vc.valor_texto.split('|').map((s: string) => s.trim()).filter(Boolean).join(', ')
            } else if (vc.valor_texto != null) {
              displayValue = vc.valor_texto
            } else if (vc.valor_numero != null) {
              displayValue = vc.valor_numero
            } else if (vc.valor_data != null) {
              displayValue = new Date(vc.valor_data).toLocaleDateString('pt-BR')
            } else if (vc.valor_booleano != null) {
              displayValue = vc.valor_booleano ? 'Sim' : 'Não'
            }

            camposCustomMap[vc.entidade_id][campoInfo.slug] = displayValue
          }
          contatos = contatos.map(c => ({
            ...c,
            campos_customizados: camposCustomMap[c.id] || {},
          }))
        }
      }

      // AIDEV-NOTE: Contagem otimizada de oportunidades — usa count agrupado (Plano Escala 5.6)
      const opsData = opsResult.data
      if (opsData) {
        const opsCount: Record<string, number> = {}
        for (const op of opsData) {
          opsCount[op.contato_id] = (opsCount[op.contato_id] || 0) + 1
        }
        contatos = contatos.map(c => ({
          ...c,
          total_oportunidades: opsCount[c.id] || 0,
        }))
      }
    }

    const total = count || 0
    return {
      contatos,
      total,
      page,
      per_page: perPage,
      total_paginas: Math.ceil(total / perPage),
    }
  },

  buscar: async (id: string): Promise<Contato> => {
    const { data, error } = await supabase
      .from('contatos')
      .select('*')
      .eq('id', id)
      .is('deletado_em', null)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Contato não encontrado')

    // Enriquecer com segmentos
    const { data: vinculosData } = await supabase
      .from('contatos_segmentos')
      .select('segmento_id, segmentos:segmento_id(id, nome, cor)')
      .eq('contato_id', id)

    const contato = data as Contato
    contato.segmentos = (vinculosData as any[] || [])
      .filter(v => v.segmentos)
      .map(v => ({ id: v.segmentos.id, nome: v.segmentos.nome, cor: v.segmentos.cor }))

    // Owner
    if (contato.owner_id) {
      const { data: ownerData } = await supabase
        .from('usuarios')
        .select('nome, sobrenome')
        .eq('id', contato.owner_id)
        .maybeSingle()
      contato.owner = ownerData ? { nome: ownerData.nome, sobrenome: ownerData.sobrenome || undefined } : null
    }

    // Empresa
    if (contato.empresa_id) {
      const { data: empresaData } = await supabase
        .from('contatos')
        .select('id, razao_social, nome_fantasia')
        .eq('id', contato.empresa_id)
        .maybeSingle()
      contato.empresa = empresaData ? { id: empresaData.id, razao_social: empresaData.razao_social || undefined, nome_fantasia: empresaData.nome_fantasia || undefined } : null
    }

    // Pessoas vinculadas (se for empresa)
    if (contato.tipo === 'empresa') {
      const { data: pessoasData } = await supabase
        .from('contatos')
        .select('id, nome, sobrenome, email, telefone, cargo, status')
        .eq('empresa_id', id)
        .is('deletado_em', null)

      contato.pessoas = (pessoasData || []).map(p => ({
        id: p.id,
        nome: p.nome || '',
        sobrenome: p.sobrenome || undefined,
        email: p.email || undefined,
        telefone: p.telefone || undefined,
        cargo: p.cargo || undefined,
        status: p.status,
      }))
    }

    return contato
  },

  criar: async (payload: Record<string, unknown>): Promise<Contato> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Filtrar apenas colunas válidas da tabela contatos
    const cleanPayload = sanitizeContatoPayload(payload)

    const { data, error } = await supabase
      .from('contatos')
      .insert({
        ...cleanPayload,
        organizacao_id: organizacaoId,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Contato
  },

  /**
   * AIDEV-NOTE: Salva valores de campos customizados (custom_*) para um contato.
   * Busca campo_id pelo slug, faz upsert na tabela valores_campos_customizados.
   */
  // AIDEV-NOTE: Salva valores de campos customizados (custom_*) para um contato.
  // Busca campo_id pelo slug + entidade, faz delete + insert na tabela valores_campos_customizados.
  salvarCamposCustomizados: async (
    contatoId: string,
    tipo: TipoContato,
    payload: Record<string, unknown>
  ): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const entidadeTipo = tipo === 'empresa' ? 'empresa' : 'pessoa'

    // Extrair campos custom_* do payload
    const customEntries: Array<{ slug: string; valor: unknown }> = []
    for (const [key, value] of Object.entries(payload)) {
      if (key.startsWith('custom_')) {
        customEntries.push({ slug: key.replace('custom_', ''), valor: value })
      }
    }

    console.log('[salvarCamposCustomizados] contatoId:', contatoId, 'tipo:', tipo, 'entries:', customEntries.length, 'slugs:', customEntries.map(e => `${e.slug}=${e.valor}`))

    if (customEntries.length === 0) {
      console.warn('[salvarCamposCustomizados] Nenhum campo custom_* encontrado no payload')
      return
    }

    // Buscar campo_id e tipo pelo slug — FILTRAR POR ENTIDADE para evitar mismatch
    const slugs = customEntries.map(e => e.slug)
    const { data: camposDefs, error: camposError } = await supabase
      .from('campos_customizados')
      .select('id, slug, tipo')
      .eq('organizacao_id', organizacaoId)
      .eq('entidade', entidadeTipo)
      .in('slug', slugs)
      .is('deletado_em', null)

    if (camposError) {
      console.error('[salvarCamposCustomizados] Erro ao buscar definições:', camposError.message)
      throw new Error(`Erro ao buscar campos customizados: ${camposError.message}`)
    }

    console.log('[salvarCamposCustomizados] camposDefs encontrados:', camposDefs?.length, camposDefs?.map(c => c.slug))

    if (!camposDefs || camposDefs.length === 0) {
      console.warn('[salvarCamposCustomizados] Nenhuma definição encontrada para slugs:', slugs, 'entidade:', entidadeTipo)
      return
    }

    const slugToCampo = new Map(camposDefs.map(c => [c.slug, c]))

    // Deletar valores existentes para esses campos e re-inserir
    const campoIds = camposDefs.map(c => c.id)
    const { error: deleteError } = await supabase
      .from('valores_campos_customizados')
      .delete()
      .eq('entidade_id', contatoId)
      .eq('entidade_tipo', entidadeTipo)
      .in('campo_id', campoIds)

    if (deleteError) {
      console.error('[salvarCamposCustomizados] Erro ao deletar existentes:', deleteError.message)
    }

    // Preparar rows para insert
    const rows: any[] = []
    for (const entry of customEntries) {
      const campo = slugToCampo.get(entry.slug)
      if (!campo) {
        console.warn('[salvarCamposCustomizados] Slug não encontrado na definição:', entry.slug)
        continue
      }

      const valor = entry.valor
      if (valor === null || valor === undefined || valor === '') continue

      const row: any = {
        organizacao_id: organizacaoId,
        entidade_id: contatoId,
        entidade_tipo: entidadeTipo,
        campo_id: campo.id,
      }

      // Mapear valor para coluna correta baseado no tipo do campo
      switch (campo.tipo) {
        case 'numero':
        case 'decimal':
        case 'moeda':
          row.valor_numero = Number(valor) || null
          break
        case 'data':
          row.valor_data = String(valor)
          break
        case 'booleano':
        case 'checkbox':
          row.valor_booleano = Boolean(valor)
          break
        case 'multi_select':
          if (typeof valor === 'string' && valor.includes('|')) {
            row.valor_json = valor.split('|').map(v => v.trim())
          } else if (Array.isArray(valor)) {
            row.valor_json = valor
          } else {
            row.valor_texto = String(valor)
          }
          break
        default:
          row.valor_texto = String(valor)
      }

      rows.push(row)
    }

    console.log('[salvarCamposCustomizados] Rows para inserir:', rows.length)

    if (rows.length > 0) {
      const { error } = await supabase
        .from('valores_campos_customizados')
        .insert(rows)

      if (error) {
        console.error('[salvarCamposCustomizados] Erro ao inserir:', error.message, 'rows:', JSON.stringify(rows))
        throw new Error(`Erro ao salvar campos customizados: ${error.message}`)
      }
      console.log('[salvarCamposCustomizados] Salvos com sucesso:', rows.length, 'campos')
    }
  },

  atualizar: async (id: string, payload: Record<string, unknown>): Promise<Contato> => {
    const cleanPayload = sanitizeContatoPayload(payload)

    const { data, error } = await supabase
      .from('contatos')
      .update(cleanPayload as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Contato
  },

  excluir: async (id: string): Promise<void> => {
    // Soft delete
    const { error } = await supabase
      .from('contatos')
      .update({ deletado_em: new Date().toISOString() } as any)
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  excluirLote: async (payload: { ids: string[]; tipo: TipoContato }): Promise<{ excluidos: number; erros: string[] }> => {
    const erros: string[] = []
    let excluidos = 0

    // AIDEV-NOTE: Usar soft delete (igual à exclusão individual) para evitar problemas com FK e RLS
    const { error } = await supabase
      .from('contatos')
      .update({ deletado_em: new Date().toISOString() } as any)
      .in('id', payload.ids)

    if (error) {
      console.error(`[excluirLote] Erro ao excluir em lote:`, error.message)
      erros.push(error.message)
    } else {
      excluidos = payload.ids.length
    }

    console.log(`[excluirLote] Resultado: ${excluidos} excluídos, ${erros.length} erros`)
    return { excluidos, erros }
  },

  atribuirLote: async (payload: { ids: string[]; owner_id: string | null }): Promise<void> => {
    const { error } = await supabase
      .from('contatos')
      .update({ owner_id: payload.owner_id } as any)
      .in('id', payload.ids)

    if (error) throw new Error(error.message)
  },

  duplicatas: async () => {
    // AIDEV-NOTE: RLS garante isolamento por tenant - filtro explicito removido
    const { data, error } = await supabase
      .from('contatos')
      .select('id, nome, sobrenome, email, telefone, tipo, status, criado_em')
      .is('deletado_em', null)
      .neq('status', 'pre_lead')
      .order('email')

    if (error) throw new Error(error.message)

    // Agrupar por email/telefone no frontend
    const groups: Record<string, any[]> = {}
    for (const c of data || []) {
      if (c.email) {
        const key = `email:${c.email.toLowerCase()}`
        if (!groups[key]) groups[key] = []
        groups[key].push(c)
      }
      if (c.telefone) {
        const cleanPhone = c.telefone.replace(/\D/g, '')
        if (cleanPhone.length >= 8) {
          const key = `tel:${cleanPhone}`
          if (!groups[key]) groups[key] = []
          groups[key].push(c)
        }
      }
    }

    // AIDEV-NOTE: Retornar apenas duplicatas (2+ contatos), deduplicando entre grupos
    // Prioridade: email > telefone (contato aparece em no máximo 1 grupo)
    const rawDuplicatas = Object.entries(groups)
      .filter(([, items]) => items.length > 1)
      .map(([key, items]) => ({
        campo: key.startsWith('email:') ? 'email' : 'telefone',
        valor: key.split(':')[1],
        contatos: items,
      }))
      // Ordenar email primeiro para priorizar
      .sort((a, b) => (a.campo === 'email' ? -1 : 1) - (b.campo === 'email' ? -1 : 1))

    // Deduplicar: cada contato aparece em no máximo 1 grupo
    const seenIds = new Set<string>()
    const duplicatas = rawDuplicatas
      .map(grupo => ({
        ...grupo,
        contatos: grupo.contatos.filter(c => !seenIds.has(c.id)),
      }))
      .filter(grupo => {
        if (grupo.contatos.length < 2) return false
        grupo.contatos.forEach(c => seenIds.add(c.id))
        return true
      })

    return { duplicatas, total: duplicatas.length }
  },

  mesclar: async (payload: { contato_manter_id: string; contato_mesclar_id: string; campos_mesclar?: string[] }): Promise<void> => {
    // Buscar ambos contatos
    const [manter, mesclar] = await Promise.all([
      contatosApi.buscar(payload.contato_manter_id),
      contatosApi.buscar(payload.contato_mesclar_id),
    ])

    // Mesclar campos vazios do manter com os do mesclar
    const camposMesclaveis = payload.campos_mesclar || ['email', 'telefone', 'cargo', 'linkedin_url', 'observacoes']
    const updates: Record<string, unknown> = {}

    for (const campo of camposMesclaveis) {
      if (!(manter as any)[campo] && (mesclar as any)[campo]) {
        updates[campo] = (mesclar as any)[campo]
      }
    }

    if (Object.keys(updates).length > 0) {
      await contatosApi.atualizar(payload.contato_manter_id, updates)
    }

    // Mover segmentos do mesclar para o manter
    if (mesclar.segmentos && mesclar.segmentos.length > 0) {
      const segmentoIds = mesclar.segmentos.map(s => s.id)
      const manterSegIds = (manter.segmentos || []).map(s => s.id)
      const novosSegmentos = segmentoIds.filter(id => !manterSegIds.includes(id))
      if (novosSegmentos.length > 0) {
        await contatosApi.vincularSegmentos(payload.contato_manter_id, novosSegmentos)
      }
    }

    // Soft-delete o contato mesclado
    await contatosApi.excluir(payload.contato_mesclar_id)
  },

  exportar: async (params?: ListarContatosParams): Promise<string> => {
    // AIDEV-NOTE: Exportacao em batches de 1000 para prevenir timeout (Plano Escala 5.5)
    const batchSize = 1000
    let allContatos: any[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('contatos')
        .select('*')
        .is('deletado_em', null)
        .order('criado_em', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (params?.tipo) query = query.eq('tipo', params.tipo)
      if (params?.status) query = query.eq('status', params.status)
      if (params?.origem) query = query.eq('origem', params.origem)
      if (params?.busca) {
        query = query.or(
          `nome.ilike.%${params.busca}%,sobrenome.ilike.%${params.busca}%,email.ilike.%${params.busca}%,razao_social.ilike.%${params.busca}%`
        )
      }

      const { data, error } = await query
      if (error) throw new Error(error.message)

      const batch = data || []
      allContatos = allContatos.concat(batch)
      hasMore = batch.length === batchSize
      offset += batchSize
    }

    const contatos = allContatos

    // Gerar CSV
    const isPessoa = params?.tipo === 'pessoa'
    const headers = isPessoa
      ? ['Nome', 'Sobrenome', 'Email', 'Telefone', 'Cargo', 'Status', 'Origem', 'Criado em']
      : ['Razão Social', 'Nome Fantasia', 'CNPJ', 'Email', 'Telefone', 'Website', 'Segmento', 'Porte', 'Status', 'Origem', 'Criado em']

    const rows = contatos.map(c => {
      if (isPessoa) {
        return [c.nome, c.sobrenome, c.email, c.telefone, c.cargo, c.status, c.origem, c.criado_em]
      }
      return [c.razao_social, c.nome_fantasia, c.cnpj, c.email, c.telefone, c.website, c.segmento, c.porte, c.status, c.origem, c.criado_em]
    })

    const csvRows = [headers.join(',')]
    for (const row of rows) {
      csvRows.push(row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
    }

    return csvRows.join('\n')
  },

  vincularSegmentos: async (contatoId: string, segmentoIds: string[]): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    // Remove existing
    await supabase
      .from('contatos_segmentos')
      .delete()
      .eq('contato_id', contatoId)

    // Insert new
    if (segmentoIds.length > 0) {
      const rows = segmentoIds.map(segId => ({
        contato_id: contatoId,
        segmento_id: segId,
        organizacao_id: organizacaoId,
      }))

      const { error } = await supabase
        .from('contatos_segmentos')
        .insert(rows)

      if (error) throw new Error(error.message)
    }
  },

  desvincularSegmento: async (contatoId: string, segmentoId: string): Promise<void> => {
    const { error } = await supabase
      .from('contatos_segmentos')
      .delete()
      .eq('contato_id', contatoId)
      .eq('segmento_id', segmentoId)

    if (error) throw new Error(error.message)
  },

  verificarVinculos: async (id: string, tipo: TipoContato): Promise<{ temVinculos: boolean; vinculos: Array<{ tipo: string; nome: string; id: string }> }> => {
    const vinculos: Array<{ tipo: string; nome: string; id: string }> = []

    if (tipo === 'empresa') {
      // Verificar pessoas vinculadas
      const { data } = await supabase
        .from('contatos')
        .select('id, nome, sobrenome')
        .eq('empresa_id', id)
        .is('deletado_em', null)

      if (data && data.length > 0) {
        for (const p of data) {
          vinculos.push({ tipo: 'Pessoa vinculada', nome: `${p.nome || ''} ${p.sobrenome || ''}`.trim(), id: p.id })
        }
      }
    } else {
      // Verificar oportunidades vinculadas
      const { data } = await supabase
        .from('oportunidades')
        .select('id, titulo')
        .eq('contato_id', id)
        .is('deletado_em', null)

      if (data && data.length > 0) {
        for (const o of data) {
          vinculos.push({ tipo: 'Oportunidade', nome: o.titulo || 'Sem título', id: o.id })
        }
      }
    }

    return { temVinculos: vinculos.length > 0, vinculos }
  },

  verificarVinculosLote: async (ids: string[], tipo: TipoContato): Promise<{ temVinculos: boolean; vinculos: Array<{ tipo: string; nome: string; id: string }> }> => {
    const vinculos: Array<{ tipo: string; nome: string; id: string }> = []

    if (tipo === 'empresa') {
      const { data } = await supabase
        .from('contatos')
        .select('id, nome, sobrenome, empresa_id')
        .in('empresa_id', ids)
        .is('deletado_em', null)

      if (data && data.length > 0) {
        for (const p of data) {
          vinculos.push({ tipo: 'Pessoa vinculada', nome: `${p.nome || ''} ${p.sobrenome || ''}`.trim(), id: p.id })
        }
      }
    }

    return { temVinculos: vinculos.length > 0, vinculos }
  },

  exportarComColunas: async (params: ListarContatosParams & { colunas: Array<{ key: string; label: string }>; ids?: string[] }): Promise<string> => {
    // AIDEV-NOTE: Exportacao em batches de 1000 para prevenir timeout (Plano Escala 5.5)
    const batchSize = 1000
    let allContatos: any[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('contatos')
        .select('*')
        .is('deletado_em', null)
        .order('criado_em', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (params.ids && params.ids.length > 0) {
        query = query.in('id', params.ids)
      } else {
        if (params.tipo) query = query.eq('tipo', params.tipo)
        if (params.status) query = query.eq('status', params.status)
        if (params.origem) query = query.eq('origem', params.origem)
        if (params.owner_id) query = query.eq('owner_id', params.owner_id)
        if (params.data_inicio) query = query.gte('criado_em', params.data_inicio)
        if (params.data_fim) query = query.lte('criado_em', params.data_fim)
        if (params.busca) {
          query = query.or(
            `nome.ilike.%${params.busca}%,sobrenome.ilike.%${params.busca}%,email.ilike.%${params.busca}%,razao_social.ilike.%${params.busca}%`
          )
        }
      }

      const { data, error } = await query
      if (error) throw new Error(error.message)

      const batch = data || []
      allContatos = allContatos.concat(batch)
      // Se filtrando por IDs específicos, não precisa paginar
      hasMore = !(params.ids && params.ids.length > 0) && batch.length === batchSize
      offset += batchSize
    }

    const contatos = allContatos
    const headers = params.colunas.map(c => c.label)
    const rows = contatos.map(c =>
      params.colunas.map(col => (c as any)[col.key] ?? '')
    )

    const csvRows = [headers.join(',')]
    for (const row of rows) {
      csvRows.push(row.map((v: any) => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
    }

    return csvRows.join('\n')
  },

  /**
   * AIDEV-NOTE: Criação de oportunidades em massa a partir de contatos selecionados
   * Busca etapa de entrada, cria oportunidades com título = nome do contato
   * Suporta distribuição: nenhuma, rodízio (round-robin), manual
   */
  criarOportunidadesLote: async (payload: {
    contato_ids: string[]
    funil_id: string
    distribuicao: 'nenhuma' | 'rodizio' | 'manual'
    membro_ids?: string[]
  }): Promise<{ criadas: number; erros: number; detalhes: string[] }> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const detalhes: string[] = []
    let criadas = 0
    let erros = 0

    // 1. Buscar etapa de entrada do funil
    const { data: etapas } = await supabase
      .from('etapas_funil')
      .select('id, tipo, ordem')
      .eq('funil_id', payload.funil_id)
      .is('deletado_em', null)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    const etapaEntrada = (etapas || []).find(e => (e as any).tipo === 'entrada') || (etapas || [])[0]
    if (!etapaEntrada) {
      throw new Error('Nenhuma etapa encontrada na pipeline selecionada')
    }

    // 2. Buscar nomes dos contatos
    const { data: contatos } = await supabase
      .from('contatos')
      .select('id, nome, sobrenome, nome_fantasia')
      .in('id', payload.contato_ids)

    if (!contatos || contatos.length === 0) {
      throw new Error('Nenhum contato encontrado')
    }

    // 3. Montar lista de membros para distribuição
    let membrosDistribuicao: string[] = []
    if (payload.distribuicao === 'rodizio') {
      const { data: funilMembros } = await supabase
        .from('funis_membros')
        .select('usuario_id')
        .eq('funil_id', payload.funil_id)
        .eq('ativo', true)
      membrosDistribuicao = (funilMembros || []).map(m => m.usuario_id)
    } else if (payload.distribuicao === 'manual' && payload.membro_ids) {
      membrosDistribuicao = payload.membro_ids
    }

    // 4. Contar oportunidades existentes de cada contato para gerar título automático
    // Lógica: "NomeContato - #N" (mesmo padrão do modal individual em /negocios)
    const contatoIds = contatos.map(c => c.id)
    const { data: contagemExistente } = await supabase
      .from('oportunidades')
      .select('contato_id')
      .in('contato_id', contatoIds)
      .is('deletado_em', null)

    const contagemPorContato: Record<string, number> = {}
    for (const row of contagemExistente || []) {
      contagemPorContato[row.contato_id] = (contagemPorContato[row.contato_id] || 0) + 1
    }

    // 5. Criar oportunidades em lote
    const oportunidades = contatos.map((c, index) => {
      const nomeContato = [c.nome, c.sobrenome].filter(Boolean).join(' ') || c.nome_fantasia || 'Sem nome'
      const countExistente = contagemPorContato[c.id] || 0
      const titulo = `${nomeContato} - #${countExistente + 1}`
      let responsavelId: string | null = null

      if (membrosDistribuicao.length > 0) {
        responsavelId = membrosDistribuicao[index % membrosDistribuicao.length]
      }

      return {
        organizacao_id: organizacaoId,
        funil_id: payload.funil_id,
        etapa_id: etapaEntrada.id,
        contato_id: c.id,
        titulo,
        usuario_responsavel_id: responsavelId,
        criado_por: userId,
        posicao: index,
      }
    })

    // Inserir em batches de 50
    const batchSize = 50
    for (let i = 0; i < oportunidades.length; i += batchSize) {
      const batch = oportunidades.slice(i, i + batchSize)
      const { error } = await supabase
        .from('oportunidades')
        .insert(batch as any)

      if (error) {
        erros += batch.length
        detalhes.push(`Erro no lote ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        criadas += batch.length
      }
    }

    // AIDEV-NOTE: Owner update agrupado por responsavel — reduz N queries para K (Plano Escala 5.3)
    if (membrosDistribuicao.length > 0) {
      const ownerGroups: Record<string, string[]> = {}
      contatos.forEach((c, i) => {
        const responsavelId = membrosDistribuicao[i % membrosDistribuicao.length]
        if (!ownerGroups[responsavelId]) ownerGroups[responsavelId] = []
        ownerGroups[responsavelId].push(c.id)
      })
      await Promise.all(
        Object.entries(ownerGroups).map(([ownerId, ids]) =>
          supabase.from('contatos').update({ owner_id: ownerId } as any).in('id', ids)
        )
      )
    }

    return { criadas, erros, detalhes }
  },

  segmentarLote: async (payload: { ids: string[]; adicionar: string[]; remover: string[] }): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    // AIDEV-NOTE: Remoção em batch — 1 query por segmento (Plano Escala 5.2)
    if (payload.remover.length > 0) {
      await Promise.all(
        payload.remover.map(segId =>
          supabase
            .from('contatos_segmentos')
            .delete()
            .in('contato_id', payload.ids)
            .eq('segmento_id', segId)
        )
      )
    }

    // AIDEV-NOTE: Upsert em batch — unique constraint (contato_id, segmento_id) já existe (Plano Escala 5.2)
    if (payload.adicionar.length > 0) {
      const rows = payload.ids.flatMap(contatoId =>
        payload.adicionar.map(segId => ({
          contato_id: contatoId,
          segmento_id: segId,
          organizacao_id: organizacaoId,
        }))
      )

      // Inserir em batches de 500 para evitar limite de payload
      const batchSize = 500
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const { error } = await supabase
          .from('contatos_segmentos')
          .upsert(batch, { onConflict: 'contato_id,segmento_id' })

        if (error) throw new Error(error.message)
      }
    }
  },
}

// =====================================================
// API Segmentos
// =====================================================

export const segmentosApi = {
  listar: async (): Promise<{ segmentos: Segmento[]; total: number }> => {
    const { data, error, count } = await supabase
      .from('segmentos')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)
      .order('nome')

    if (error) throw new Error(error.message)

    // Contar contatos por segmento
    const segmentos = data || []
    if (segmentos.length > 0) {
      const segmentoIds = segmentos.map(s => s.id)
      const { data: vinculosData } = await supabase
        .from('contatos_segmentos')
        .select('segmento_id')
        .in('segmento_id', segmentoIds)

      const counts: Record<string, number> = {}
      for (const v of vinculosData || []) {
        counts[v.segmento_id] = (counts[v.segmento_id] || 0) + 1
      }

      for (const s of segmentos) {
        (s as any).total_contatos = counts[s.id] || 0
      }
    }

    return { segmentos: segmentos as Segmento[], total: count || 0 }
  },

  criar: async (payload: { nome: string; cor: string; descricao?: string }): Promise<Segmento> => {
    const organizacaoId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('segmentos')
      .insert({
        ...payload,
        organizacao_id: organizacaoId,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Segmento
  },

  atualizar: async (id: string, payload: { nome?: string; cor?: string; descricao?: string | null }): Promise<Segmento> => {
    const { data, error } = await supabase
      .from('segmentos')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Segmento
  },

  excluir: async (id: string): Promise<void> => {
    // Primeiro remove vínculos
    await supabase
      .from('contatos_segmentos')
      .delete()
      .eq('segmento_id', id)

    // Depois exclui o segmento
    const { error } = await supabase
      .from('segmentos')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
