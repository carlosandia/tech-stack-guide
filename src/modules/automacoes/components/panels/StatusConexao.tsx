/**
 * AIDEV-NOTE: Badge de status de conexão para ações WhatsApp e Email
 * Consulta integracoes (whatsapp) e conexoes_email (email) para exibir status
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'

interface StatusConexaoProps {
  tipo: 'whatsapp' | 'email'
  conexaoTipo?: string
  onConexaoTipoChange?: (tipo: string) => void
}

export function StatusConexao({ tipo, conexaoTipo, onConexaoTipoChange }: StatusConexaoProps) {
  const { data: conectado, isLoading } = useQuery({
    queryKey: ['automacao-conexao-status', tipo],
    queryFn: async () => {
      if (tipo === 'whatsapp') {
        // AIDEV-NOTE: WhatsApp usa tabela sessoes_whatsapp, status 'connected'
        const { data } = await supabase
          .from('sessoes_whatsapp')
          .select('id, status, phone_number')
          .eq('status', 'connected')
          .is('deletado_em', null)
          .limit(1)
        return (data && data.length > 0)
      } else {
        const { data } = await supabase
          .from('conexoes_email')
          .select('id, status')
          .in('status', ['conectado', 'ativo'])
          .is('deletado_em', null)
          .limit(1)
        return (data && data.length > 0)
      }
    },
    staleTime: 30_000,
  })

  return (
    <div className="space-y-2 mb-3">
      {/* Badge de status */}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
            Verificando...
          </Badge>
        ) : conectado ? (
          <Badge className="text-[10px] gap-1 bg-green-100 text-green-700 border-green-300">
            <Wifi className="w-3 h-3" />
            Conectado
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <WifiOff className="w-3 h-3" />
            Desconectado
          </Badge>
        )}
      </div>

      {/* Alerta se desconectado */}
      {!isLoading && !conectado && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-amber-700">
            Nenhuma conexão {tipo === 'whatsapp' ? 'WhatsApp' : 'de e-mail'} ativa. Configure em{' '}
            <a href="/configuracoes/conexoes" className="underline font-medium hover:text-amber-900">
              Configurações → Conexões
            </a>.
          </p>
        </div>
      )}

      {/* Seletor de tipo de conexão (futuro) */}
      {onConexaoTipoChange && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Tipo de conexão
          </label>
          <select
            value={conexaoTipo || (tipo === 'whatsapp' ? 'waha' : 'smtp')}
            onChange={e => onConexaoTipoChange(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {tipo === 'whatsapp' ? (
              <>
                <option value="waha">WAHA (WhatsApp Web)</option>
                <option value="api_oficial" disabled>API Oficial (em breve)</option>
              </>
            ) : (
              <>
                <option value="smtp">SMTP / Gmail</option>
                <option value="marketing" disabled>Email Marketing (em breve)</option>
              </>
            )}
          </select>
        </div>
      )}
    </div>
  )
}
