/**
 * AIDEV-NOTE: Configuração do nó Trigger
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TRIGGER_TIPOS, TRIGGER_CATEGORIAS } from '../../schemas/automacoes.schema'
import { WebhookDebugPanel } from './WebhookDebugPanel'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface TriggerConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

export function TriggerConfig({ data, onUpdate }: TriggerConfigProps) {
  const currentTipo = data.trigger_tipo as string
  // Primeira categoria expandida por padrão
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set([TRIGGER_CATEGORIAS[0]?.key])
  )

  // AIDEV-NOTE: Buscar organizacao_id do usuário logado
  const { data: usuario } = useQuery({
    queryKey: ['usuario-atual-trigger'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('usuarios')
        .select('organizacao_id')
        .eq('auth_id', user.id)
        .single()
      return data
    },
    staleTime: Infinity,
  })

  const toggleCat = (key: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const triggerConfig = (data.trigger_config as Record<string, unknown>) || {}

  const handleTriggerConfigUpdate = (newConfig: Record<string, unknown>) => {
    onUpdate({ ...data, trigger_config: newConfig })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Tipo de Gatilho</label>
        <p className="text-xs text-muted-foreground mb-2">Quando esta automação deve ser ativada?</p>
      </div>

      {TRIGGER_CATEGORIAS.map(cat => {
        const triggers = TRIGGER_TIPOS.filter(t => t.categoria === cat.key)
        if (triggers.length === 0) return null
        const isExpanded = expandedCats.has(cat.key)
        return (
          <div key={cat.key}>
            <button
              type="button"
              onClick={() => toggleCat(cat.key)}
              className="flex items-center gap-1 w-full text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {cat.label}
            </button>
            {isExpanded && (
              <div className="space-y-1">
                {triggers.map(t => (
                  <button
                    key={t.tipo}
                    onClick={() => onUpdate({ ...data, trigger_tipo: t.tipo })}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                      ${currentTipo === t.tipo
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'hover:bg-accent text-foreground border border-transparent'
                      }
                    `}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* AIDEV-NOTE: GAP 6 — Campos extras para trigger campo_contato_alterado */}
      {currentTipo === 'campo_contato_alterado' && (
        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Configuração do gatilho</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Campo monitorado</label>
            <select
              value={(triggerConfig.campo_monitorado as string) || ''}
              onChange={e => handleTriggerConfigUpdate({
                ...triggerConfig,
                campo_monitorado: e.target.value,
              })}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Qualquer campo</option>
              <option value="nome">Nome</option>
              <option value="email">Email</option>
              <option value="telefone">Telefone</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Valor esperado (opcional)</label>
            <input
              type="text"
              value={(triggerConfig.valor_esperado as string) || ''}
              onChange={e => handleTriggerConfigUpdate({
                ...triggerConfig,
                valor_esperado: e.target.value,
              })}
              placeholder="Filtrar por valor específico"
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* AIDEV-NOTE: Painel de debug para trigger webhook_recebido */}
      {currentTipo === 'webhook_recebido' && usuario?.organizacao_id && (
        <WebhookDebugPanel
          triggerConfig={triggerConfig}
          onConfigUpdate={handleTriggerConfigUpdate}
          organizacaoId={usuario.organizacao_id}
        />
      )}
    </div>
  )
}
