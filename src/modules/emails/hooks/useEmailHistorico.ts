/**
 * AIDEV-NOTE: Hook para buscar histórico de abertura de emails enviados
 * Consulta email_aberturas JOIN emails_recebidos para emails enviados que foram abertos pelo destinatário
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AberturaItem {
  id: string
  email_id: string
  para_email: string
  assunto: string
  total_aberturas: number
  primeira_abertura: string
  ultima_abertura: string
}

export function useEmailHistoricoAberturas() {
  return useQuery({
    queryKey: ['email-historico-aberturas'],
    queryFn: async (): Promise<AberturaItem[]> => {
      // Buscar emails enviados que têm aberturas registradas
      const { data, error } = await supabase
        .from('emails_recebidos')
        .select('id, para_email, assunto, total_aberturas, aberto_em')
        .eq('pasta', 'sent')
        .gt('total_aberturas', 0)
        .not('aberto_em', 'is', null)
        .order('aberto_em', { ascending: false })
        .limit(20)

      if (error) throw error

      return (data || []).map((e) => ({
        id: e.id,
        email_id: e.id,
        para_email: e.para_email,
        assunto: e.assunto || '(sem assunto)',
        total_aberturas: e.total_aberturas || 0,
        primeira_abertura: e.aberto_em!,
        ultima_abertura: e.aberto_em!,
      }))
    },
    // AIDEV-NOTE: Polling removido — Realtime invalida cache quando emails são atualizados
    staleTime: 30000,
  })
}
