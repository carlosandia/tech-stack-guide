/**
 * AIDEV-NOTE: Hook para campos dinâmicos nos detalhes da oportunidade
 * Busca campos_customizados (sistema + custom) e seus valores
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CampoDefinicao {
  id: string
  nome: string
  slug: string
  entidade: string
  tipo: string
  sistema: boolean
  obrigatorio: boolean
  ordem: number
  opcoes: any[] | null
}

export interface ValorCampo {
  campo_id: string
  valor_texto: string | null
  valor_numero: number | null
  valor_data: string | null
  valor_booleano: boolean | null
  valor_json: any | null
}

/**
 * Busca todos os campos (sistema + custom) de pessoa e oportunidade
 */
export function useCamposDefinicoes() {
  return useQuery({
    queryKey: ['campos-detalhes', 'definicoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campos_customizados')
        .select('id, nome, slug, entidade, tipo, sistema, obrigatorio, ordem, opcoes')
        .in('entidade', ['pessoa', 'oportunidade'])
        .is('deletado_em', null)
        .eq('ativo', true)
        .order('entidade')
        .order('ordem', { ascending: true })

      if (error) throw error

      const pessoa: CampoDefinicao[] = []
      const oportunidade: CampoDefinicao[] = []

      for (const c of (data || []) as unknown as CampoDefinicao[]) {
        if (c.entidade === 'pessoa') pessoa.push(c)
        else if (c.entidade === 'oportunidade') oportunidade.push(c)
      }

      return { pessoa, oportunidade }
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Busca valores de campos customizados para uma entidade específica
 */
export function useValoresCampos(entidadeTipo: string, entidadeId: string | null | undefined) {
  return useQuery({
    queryKey: ['campos-detalhes', 'valores', entidadeTipo, entidadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valores_campos_customizados')
        .select('campo_id, valor_texto, valor_numero, valor_data, valor_booleano, valor_json')
        .eq('entidade_tipo', entidadeTipo)
        .eq('entidade_id', entidadeId!)

      if (error) throw error

      const mapa = new Map<string, ValorCampo>()
      for (const v of (data || []) as unknown as ValorCampo[]) {
        mapa.set(v.campo_id, v)
      }
      return mapa
    },
    enabled: !!entidadeId,
    staleTime: 30 * 1000,
  })
}

/**
 * Mapeia slug de campo sistema pessoa → coluna na tabela contatos
 */
export const SLUG_TO_CONTATO_COLUMN: Record<string, string> = {
  nome: 'nome',
  sobrenome: 'sobrenome',
  email: 'email',
  telefone: 'telefone',
  cargo: 'cargo',
  linkedin: 'linkedin_url',
  endereco_cidade: 'endereco_cidade',
  endereco_estado: 'endereco_estado',
  endereco_cep: 'endereco_cep',
}

/**
 * Extrai o valor de exibição de um campo customizado
 */
export function getValorExibicao(campo: CampoDefinicao, valor: ValorCampo | undefined): string {
  if (!valor) return ''

  switch (campo.tipo) {
    case 'texto':
    case 'texto_longo':
    case 'email':
    case 'telefone':
    case 'url':
    case 'cpf':
    case 'cnpj':
    case 'select':
      return valor.valor_texto || ''
    case 'numero':
      return valor.valor_numero != null ? String(valor.valor_numero) : ''
    case 'decimal':
      return valor.valor_numero != null ? valor.valor_numero.toFixed(2) : ''
    case 'data':
    case 'data_hora':
      return valor.valor_data ? new Date(valor.valor_data).toLocaleDateString('pt-BR') : ''
    case 'booleano':
      return valor.valor_booleano != null ? (valor.valor_booleano ? 'Sim' : 'Não') : ''
    case 'multi_select':
      if (valor.valor_json && Array.isArray(valor.valor_json)) {
        return (valor.valor_json as string[]).join(', ')
      }
      // Fallback: valor_texto com delimitador |
      if (valor.valor_texto) {
        return valor.valor_texto.split('|').map(v => v.trim()).filter(Boolean).join(', ')
      }
      return ''
    default:
      return valor.valor_texto || ''
  }
}
