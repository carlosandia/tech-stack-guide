/**
 * AIDEV-NOTE: Modal de conexão Meta Ads (Lead Ads, CAPI, Audiences)
 * Conforme PRD-08 Seção 2.3 - Meta Ads
 */

import { BarChart3, Loader2, Target, Megaphone, BarChart } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { useObterAuthUrl } from '../../hooks/useIntegracoes'

interface MetaAdsConexaoModalProps {
  onClose: () => void
}

const RECURSOS = [
  {
    icon: Target,
    titulo: 'Lead Ads',
    descricao: 'Captura automática de leads de formulários do Facebook e Instagram Ads',
  },
  {
    icon: BarChart,
    titulo: 'Conversions API (CAPI)',
    descricao: 'Envie eventos de conversão do CRM para otimizar campanhas',
  },
  {
    icon: Megaphone,
    titulo: 'Custom Audiences',
    descricao: 'Sincronize contatos do CRM para segmentação de anúncios',
  },
]

export function MetaAdsConexaoModal({ onClose }: MetaAdsConexaoModalProps) {
  const obterAuthUrl = useObterAuthUrl()

  const handleConectar = async () => {
    try {
      const redirectUri = `${window.location.origin}/app/configuracoes/conexoes`
      const result = await obterAuthUrl.mutateAsync({
        plataforma: 'meta_ads',
        redirect_uri: redirectUri,
      })
      if (result.url) {
        window.location.href = result.url
      }
    } catch {
      // Toast handled by hook
    }
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Conectar Meta Ads"
      description="Integre suas campanhas do Facebook e Instagram Ads"
      icon={BarChart3}
      variant="create"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConectar}
            disabled={obterAuthUrl.isPending}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {obterAuthUrl.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Conectar Meta Ads'
            )}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Recursos */}
        <div className="space-y-4">
          {RECURSOS.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <r.icon className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{r.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.descricao}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            Você será redirecionado para o Facebook para autorizar o acesso. São necessárias
            permissões de gerenciamento de páginas, leads e anúncios.
          </p>
        </div>
      </div>
    </ModalBase>
  )
}
