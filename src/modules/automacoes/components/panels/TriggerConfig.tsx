/**
 * AIDEV-NOTE: Configuração do nó Trigger
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TRIGGER_TIPOS, TRIGGER_CATEGORIAS } from '../../schemas/automacoes.schema'
import { WebhookDebugPanel } from './WebhookDebugPanel'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { getOrganizacaoId } from '@/shared/services/auth-context'

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

  // AIDEV-NOTE: Usa auth-context compartilhado (DRY) em vez de query inline
  const { data: organizacaoId } = useQuery({
    queryKey: ['org-id'],
    queryFn: getOrganizacaoId,
    staleTime: Infinity,
  })

  // AIDEV-NOTE: Buscar formulários do tenant para trigger formulario_submetido
  const { data: formularios } = useQuery({
    queryKey: ['formularios-trigger', organizacaoId],
    queryFn: async () => {
      const { data } = await supabase
        .from('formularios')
        .select('id, nome, status')
        .eq('organizacao_id', organizacaoId!)
        .is('deletado_em', null)
        .order('nome')
      return data || []
    },
    enabled: !!organizacaoId && currentTipo === 'formulario_submetido',
    staleTime: 30000,
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

      {/* AIDEV-NOTE: Seletor de formulário para trigger formulario_submetido */}
      {currentTipo === 'formulario_submetido' && (
        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Configuração do gatilho</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Formulário</label>
            <select
              value={(triggerConfig.formulario_id as string) || ''}
              onChange={e => handleTriggerConfigUpdate({
                ...triggerConfig,
                formulario_id: e.target.value || undefined,
              })}
              className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Qualquer formulário</option>
              {(formularios || []).map(f => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.status !== 'publicado' ? `(${f.status})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1">
              Selecione um formulário específico ou deixe em branco para qualquer um
            </p>
          </div>
        </div>
      )}

      {/* AIDEV-NOTE: Painel de debug para trigger webhook_recebido */}
      {currentTipo === 'webhook_recebido' && organizacaoId && (
        <WebhookDebugPanel
          triggerConfig={triggerConfig}
          onConfigUpdate={handleTriggerConfigUpdate}
          organizacaoId={organizacaoId}
        />
      )}
    </div>
  )
}
