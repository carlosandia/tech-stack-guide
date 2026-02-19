/**
 * AIDEV-NOTE: Modal de conexão Instagram Direct
 * Conforme PRD-08 Seção 7.4 - Instagram Direct via Meta
 */

import { Instagram, Loader2, MessageCircle, Users, ShieldCheck } from 'lucide-react'
import { ModalBase } from '../ui/ModalBase'
import { useObterAuthUrl } from '../../hooks/useIntegracoes'

interface InstagramConexaoModalProps {
  onClose: () => void
}

const REQUISITOS = [
  { icon: Users, text: 'Conta Instagram Business ou Creator' },
  { icon: MessageCircle, text: 'Página do Facebook vinculada à conta' },
  { icon: ShieldCheck, text: 'Permissões de mensagem habilitadas' },
]

const BENEFICIOS = [
  'Receber mensagens do Instagram Direct no CRM',
  'Responder diretamente pela plataforma',
  'Vincular conversas a oportunidades',
  'Histórico centralizado de interações',
]

export function InstagramConexaoModal({ onClose }: InstagramConexaoModalProps) {
  const obterAuthUrl = useObterAuthUrl()

  const handleConectar = async () => {
    try {
      const redirectUri = `${window.location.origin}/configuracoes/conexoes`
      const result = await obterAuthUrl.mutateAsync({
        plataforma: 'instagram',
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
      title="Conectar Instagram Direct"
      description="Integre suas mensagens do Instagram ao CRM"
      icon={Instagram}
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
              'Conectar Instagram'
            )}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Requisitos */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Requisitos</p>
          <div className="space-y-2.5">
            {REQUISITOS.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <r.icon className="w-3.5 h-3.5 text-pink-600" />
                </div>
                <p className="text-sm text-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefícios */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">O que você poderá fazer</p>
          <ul className="space-y-2">
            {BENEFICIOS.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{b}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div className="bg-[hsl(var(--warning-muted))] border border-[hsl(var(--warning-foreground))]/20 rounded-lg p-3">
          <p className="text-xs text-[hsl(var(--warning-foreground))]">
            A conexão será feita via Meta Business Suite. Você será redirecionado para autorizar o acesso.
          </p>
        </div>
      </div>
    </ModalBase>
  )
}
