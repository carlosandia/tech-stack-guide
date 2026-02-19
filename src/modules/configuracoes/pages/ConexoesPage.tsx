/**
 * AIDEV-NOTE: Página de Conexões OAuth
 * Conforme PRD-08 - Conexões com Plataformas Externas
 * Admin Only - Members bloqueados
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useIntegracoes, useDesconectarIntegracao, useSincronizarIntegracao, useProcessarCallback } from '../hooks/useIntegracoes'
import { ConexaoCard } from '../components/integracoes/ConexaoCard'
import { WhatsAppQrCodeModal } from '../components/integracoes/WhatsAppQrCodeModal'
import { EmailConexaoModal } from '../components/integracoes/EmailConexaoModal'
import { InstagramConexaoModal } from '../components/integracoes/InstagramConexaoModal'
import { MetaAdsConexaoModal } from '../components/integracoes/MetaAdsConexaoModal'
import { GoogleCalendarConexaoModal } from '../components/integracoes/GoogleCalendarConexaoModal'
import { GoogleCalendarConfigModal } from '../components/integracoes/GoogleCalendarConfigModal'
import { Api4comConexaoModal } from '../components/integracoes/Api4comConexaoModal'
import { WhatsAppConfigModal } from '../components/integracoes/WhatsAppConfigModal'
import { Api4comConfigModal } from '../components/integracoes/Api4comConfigModal'
import { EmailConfigModal } from '../components/integracoes/EmailConfigModal'
import type { PlataformaIntegracao, Integracao } from '../services/configuracoes.api'

const PLATAFORMAS: PlataformaIntegracao[] = ['whatsapp', 'instagram', 'meta_ads', 'google', 'email', 'api4com']

export function ConexoesPage() {
  const { setSubtitle, setActions } = useConfigToolbar()
  const { data, isLoading, refetch } = useIntegracoes()
  const desconectar = useDesconectarIntegracao()
  const sincronizar = useSincronizarIntegracao()
  const processarCallback = useProcessarCallback()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalAberto, setModalAberto] = useState<PlataformaIntegracao | null>(null)
  const [configAberto, setConfigAberto] = useState<PlataformaIntegracao | null>(null)
  const callbackProcessado = useRef(false)

  useEffect(() => {
    setSubtitle('Gerencie conexões com plataformas externas')
    setActions(null)
    return () => { setSubtitle(null); setActions(null) }
  }, [setSubtitle, setActions])

  // Handle OAuth callback from URL params
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (success) {
      toast.success(`${success.charAt(0).toUpperCase() + success.slice(1)} conectado com sucesso!`)
      refetch()
      setSearchParams({}, { replace: true })
    }

    if (error) {
      toast.error(`Erro na autenticação: ${error}`)
      setSearchParams({}, { replace: true })
    }

    // AIDEV-NOTE: Meta Ads OAuth callback - Facebook redireciona aqui com code+state
    if (code && state && !callbackProcessado.current) {
      callbackProcessado.current = true
      const redirectUri = `${window.location.origin}/app/configuracoes/conexoes`
      processarCallback.mutate(
        { plataforma: 'meta_ads', code, state, redirect_uri: redirectUri },
        {
          onSuccess: () => {
            toast.success('Meta Ads conectado com sucesso!')
            refetch()
            setSearchParams({}, { replace: true })
          },
          onError: (err) => {
            toast.error(`Erro ao conectar Meta Ads: ${(err as Error).message}`)
            setSearchParams({}, { replace: true })
            callbackProcessado.current = false
          },
        }
      )
    }
  }, [searchParams, setSearchParams, refetch, processarCallback])

  // Criar mapa de integracoes por plataforma
  const integracoesPorPlataforma: Record<string, Integracao | undefined> = {}
  if (data?.integracoes) {
    for (const integracao of data.integracoes) {
      if (!integracoesPorPlataforma[integracao.plataforma] || integracao.status === 'conectado') {
        integracoesPorPlataforma[integracao.plataforma] = integracao
      }
    }
  }

  const handleConectar = (plataforma: PlataformaIntegracao) => {
    setModalAberto(plataforma)
  }

  const handleDesconectar = (plataforma: PlataformaIntegracao, id: string) => {
    desconectar.mutate({ plataforma, id })
  }

  const handleSincronizar = (id: string) => {
    sincronizar.mutate(id)
  }

  const handleConfigurar = (plataforma: PlataformaIntegracao) => {
    setConfigAberto(plataforma)
  }

  const handleModalSuccess = () => {
    setModalAberto(null)
    refetch()
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
            onConfigurar={handleConfigurar}
            isLoading={
              desconectar.isPending ||
              sincronizar.isPending
            }
          />
        ))}
      </div>

      {/* Modais de conexão */}

      {/* Modais de conexão */}
      {modalAberto === 'whatsapp' && (
        <WhatsAppQrCodeModal
          onClose={() => setModalAberto(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalAberto === 'email' && (
        <EmailConexaoModal
          onClose={() => setModalAberto(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalAberto === 'instagram' && (
        <InstagramConexaoModal
          onClose={() => setModalAberto(null)}
        />
      )}

      {modalAberto === 'meta_ads' && (
        <MetaAdsConexaoModal
          onClose={() => setModalAberto(null)}
        />
      )}

      {modalAberto === 'google' && (
        <GoogleCalendarConexaoModal
          onClose={() => setModalAberto(null)}
        />
      )}

      {modalAberto === 'api4com' && (
        <Api4comConexaoModal
          onClose={() => setModalAberto(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Modais de configuração */}
      {configAberto === 'whatsapp' && integracoesPorPlataforma['whatsapp'] && (
        <WhatsAppConfigModal
          integracao={integracoesPorPlataforma['whatsapp']}
          onClose={() => setConfigAberto(null)}
        />
      )}

      {configAberto === 'api4com' && integracoesPorPlataforma['api4com'] && (
        <Api4comConfigModal
          integracao={integracoesPorPlataforma['api4com']}
          onClose={() => setConfigAberto(null)}
          onDesconectar={handleDesconectar}
        />
      )}

      {configAberto === 'email' && integracoesPorPlataforma['email'] && (
        <EmailConfigModal
          integracao={integracoesPorPlataforma['email']}
          onClose={() => setConfigAberto(null)}
          onDesconectar={handleDesconectar}
        />
      )}

      {configAberto === 'google' && integracoesPorPlataforma['google'] && (
        <GoogleCalendarConfigModal
          integracao={integracoesPorPlataforma['google']}
          onClose={() => setConfigAberto(null)}
          onDesconectar={handleDesconectar}
        />
      )}
    </div>
  )
}
