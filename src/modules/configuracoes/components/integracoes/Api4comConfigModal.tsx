/**
 * AIDEV-NOTE: Modal de configuração avançada API4COM
 * Status, testar conexão, pipeline config
 * Conforme Design System 10.5 - ModalBase
 */

import { useState } from 'react'
import { Phone, Loader2, CheckCircle2, XCircle, Globe } from 'lucide-react'

import { ModalBase } from '../ui/ModalBase'
import { supabase } from '@/lib/supabase'
import type { Integracao, PlataformaIntegracao } from '../../services/configuracoes.api'

interface Props {
  integracao: Integracao
  onClose: () => void
  onDesconectar: (plataforma: PlataformaIntegracao, id: string) => void
}

export function Api4comConfigModal({ integracao, onClose, onDesconectar }: Props) {
  const [testando, setTestando] = useState(false)
  const [testeResult, setTesteResult] = useState<{ valid: boolean; message?: string } | null>(null)

  const handleTestarConexao = async () => {
    setTestando(true)
    setTesteResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('api4com-proxy', {
        body: { action: 'test-saved' },
      })

      if (error) {
        setTesteResult({ valid: false, message: 'Erro ao testar conexão' })
      } else {
        setTesteResult(data)
      }
    } catch {
      setTesteResult({ valid: false, message: 'Erro de rede' })
    } finally {
      setTestando(false)
    }
  }

  const handleDesconectar = () => {
    onDesconectar('api4com', integracao.id)
    onClose()
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <ModalBase
      onClose={onClose}
      title="Configurações API4COM"
      description="Telefonia VoIP"
      icon={Phone}
      variant="edit"
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={handleDesconectar}
            className="text-xs font-medium px-3 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
          >
            Desconectar
          </button>
          <button
            onClick={onClose}
            className="text-xs font-medium px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Status da Conexão</h4>
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]">
                <CheckCircle2 className="w-3 h-3" />
                Conectado
              </span>
            </div>
            {integracao.conta_externa_nome && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Conta</span>
                <span className="text-xs text-foreground">{integracao.conta_externa_nome}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conectado em</span>
              <span className="text-xs text-foreground">{formatDate(integracao.conectado_em)}</span>
            </div>
          </div>
        </div>

        {/* Testar Conexão */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Validação</h4>
          <button
            onClick={handleTestarConexao}
            disabled={testando}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {testando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            Testar Conexão
          </button>

          {testeResult && (
            <div className={`flex items-center gap-1.5 text-xs p-2 rounded-md ${
              testeResult.valid
                ? 'bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {testeResult.valid ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {testeResult.valid ? 'Conexão válida!' : testeResult.message || 'Token inválido'}
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  )
}
