import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

/**
 * AIDEV-NOTE: Hook público para buscar configuração do banner de login
 * Query anônima (sem auth) - RLS permite SELECT para anon em plataforma = 'login_banner'
 */

export interface LoginBannerConfig {
  desktop_image_url: string
  tablet_image_url: string
  mobile_image_url: string
  link_url: string
  background_color: string
}

export function useLoginBanner() {
  return useQuery({
    queryKey: ['login-banner'],
    queryFn: async (): Promise<LoginBannerConfig | null> => {
      const { data, error } = await supabase
        .from('configuracoes_globais')
        .select('configuracoes')
        .eq('plataforma', 'login_banner')
        .maybeSingle()

      if (error || !data) return null

      const config = data.configuracoes as unknown as LoginBannerConfig
      return config
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10,
    retry: 1,
  })
}
