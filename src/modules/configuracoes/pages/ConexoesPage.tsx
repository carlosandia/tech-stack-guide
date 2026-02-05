/**
 * AIDEV-NOTE: Página de Conexões OAuth
 * Conforme PRD-05 - Conexões com Plataformas Externas
 * Admin Only - Members bloqueados
 */

import { useEffect } from 'react'
import { Loader2, Link2 } from 'lucide-react'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useIntegracoes, useDesconectarIntegracao, useSincronizarIntegracao, useObterAuthUrl } from '../hooks/useIntegracoes'
import { ConexaoCard } from '../components/integracoes/ConexaoCard'
import type { PlataformaIntegracao, Integracao } from '../services/configuracoes.api'

const PLATAFORMAS: PlataformaIntegracao[] = ['whatsapp', 'instagram', 'meta_ads', 'google', 'email']

export function ConexoesPage() {
  const { setSubtitle, setActions } = useConfigToolbar()
  const { data, isLoading } = useIntegracoes()
  const desconectar = useDesconectarIntegracao()
  const sincronizar = useSincronizarIntegracao()
  const obterAuthUrl = useObterAuthUrl()

  useEffect(() => {
    setSubtitle('Gerencie conexões com plataformas externas')
    setActions(null)
    return () => { setSubtitle(null); setActions(null) }
  }, [setSubtitle, setActions])

  // Criar mapa de integracoes por plataforma
  const integracoesPorPlataforma: Record<string, Integracao | undefined> = {}
  if (data?.integracoes) {
    for (const integracao of data.integracoes) {
      // Pegar a mais recente/conectada por plataforma
      if (!integracoesPorPlataforma[integracao.plataforma] || integracao.status === 'conectado') {
        integracoesPorPlataforma[integracao.plataforma] = integracao
      }
    }
  }

  const handleConectar = async (plataforma: PlataformaIntegracao) => {
    // Para plataformas OAuth (google, meta_ads), redirecionar para URL de autenticação
    if (plataforma === 'google' || plataforma === 'meta_ads') {
      try {
        const redirectUri = `${window.location.origin}/app/configuracoes/conexoes`
        const result = await obterAuthUrl.mutateAsync({ plataforma, redirect_uri: redirectUri })
        if (result.url) {
          window.location.href = result.url
        }
      } catch (error) {
        console.error('Erro ao obter URL de autenticação:', error)
      }
    }
    // Para outras plataformas, a lógica de conexão é diferente (WAHA, SMTP)
    // TODO: Implementar modais específicos para WhatsApp/Instagram/Email
  }

  const handleDesconectar = (id: string) => {
    desconectar.mutate(id)
  }

  const handleSincronizar = (id: string) => {
    sincronizar.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header informativo */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Conexões com Plataformas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conecte o CRM com WhatsApp, Instagram, Meta Ads, Google Calendar e Email para centralizar
              suas comunicações e automatizar fluxos de trabalho.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Conexões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PLATAFORMAS.map((plataforma) => (
          <ConexaoCard
            key={plataforma}
            plataforma={plataforma}
            integracao={integracoesPorPlataforma[plataforma]}
            onConectar={handleConectar}
            onDesconectar={handleDesconectar}
            onSincronizar={handleSincronizar}
            isLoading={
              desconectar.isPending ||
              sincronizar.isPending ||
              obterAuthUrl.isPending
            }
          />
        ))}
      </div>
    </div>
  )
}
