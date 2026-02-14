/**
 * AIDEV-NOTE: Service para persistir preferências de colunas no banco
 * Conforme plano - upsert/select por usuario_id + tipo
 */

import { supabase } from '@/lib/supabase'
import type { ColumnConfig } from '../components/ContatoColumnsToggle'
import type { TipoContato } from './contatos.api'

export async function buscarPreferenciaColunas(tipo: TipoContato): Promise<ColumnConfig[] | null> {
  const { data, error } = await supabase
    .from('preferencias_colunas_contatos')
    .select('colunas')
    .eq('tipo', tipo)
    .maybeSingle()

  if (error) {
    console.error('[preferencias] Erro ao buscar:', error)
    return null
  }

  return data?.colunas as ColumnConfig[] | null
}

export async function salvarPreferenciaColunas(
  usuarioId: string,
  tipo: TipoContato,
  colunas: ColumnConfig[]
): Promise<void> {
  const { error } = await supabase
    .from('preferencias_colunas_contatos')
    .upsert(
      { usuario_id: usuarioId, tipo, colunas: colunas as any },
      { onConflict: 'usuario_id,tipo' }
    )

  if (error) {
    console.error('[preferencias] Erro ao salvar:', error)
    throw error
  }
}
