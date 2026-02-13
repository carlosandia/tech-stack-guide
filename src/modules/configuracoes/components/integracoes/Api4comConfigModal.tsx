/**
 * AIDEV-NOTE: Modal de configuração avançada API4COM
 * Status, testar conexão, configuração de ramal VoIP
 * Ramal visível para admin e member
 * Conforme Design System 10.5 - ModalBase
 */

import { useState, useEffect } from 'react'
import { Phone, Loader2, CheckCircle2, XCircle, Globe, Save } from 'lucide-react'

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

  // Ramal VoIP
  const [ramalExtension, setRamalExtension] = useState('')
  const [ramalPassword, setRamalPassword] = useState('')
  const [ramalSipServer, setRamalSipServer] = useState('sip.api4com.com.br')
  const [ramalNome, setRamalNome] = useState('')
  const [ramalCarregado, setRamalCarregado] = useState(false)
  const [ramalExistente, setRamalExistente] = useState(false)
  const [salvandoRamal, setSalvandoRamal] = useState(false)
  const [ramalResult, setRamalResult] = useState<{ success: boolean; message?: string } | null>(null)

  // Carregar ramal existente
  useEffect(() => {
    async function carregarRamal() {
      try {
        const { data } = await supabase.functions.invoke('api4com-proxy', {
          body: { action: 'get-extension' },
        })
        if (data?.ramal) {
          setRamalExtension(data.ramal.extension || '')
          setRamalSipServer(data.ramal.sip_server || 'sip.api4com.com.br')
          setRamalNome(data.ramal.nome_exibicao || '')
          setRamalExistente(true)
        }
      } catch {
        // silencioso
      } finally {
        setRamalCarregado(true)
      }
    }
    carregarRamal()
  }, [])

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

  const handleSalvarRamal = async () => {
    if (!ramalExtension || !ramalPassword) {
      setRamalResult({ success: false, message: 'Ramal e senha são obrigatórios' })
      return
    }
    setSalvandoRamal(true)
    setRamalResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('api4com-proxy', {
        body: {
          action: 'save-extension',
          extension: ramalExtension,
          password: ramalPassword,
          sip_server: ramalSipServer,
          nome_exibicao: ramalNome || null,
        },
      })

      if (error) {
        setRamalResult({ success: false, message: 'Erro ao salvar ramal' })
      } else if (data?.success) {
        setRamalResult({ success: true, message: 'Ramal salvo com sucesso!' })
        setRamalExistente(true)
        setRamalPassword('') // Limpar senha após salvar
      } else {
        setRamalResult({ success: false, message: data?.message || 'Erro ao salvar ramal' })
      }
    } catch {
      setRamalResult({ success: false, message: 'Erro de rede' })
    } finally {
      setSalvandoRamal(false)
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
      <div className="px-4 sm:px-6 py-4 space-y-5">
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

        {/* Configuração de Ramal VoIP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">Meu Ramal VoIP</h4>
            {ramalExistente && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Configurado
              </span>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Configure seu ramal para realizar ligações diretamente pelo CRM. Cada usuário deve configurar seu próprio ramal.
          </p>

          {ramalCarregado ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Ramal *</label>
                  <input
                    type="text"
                    value={ramalExtension}
                    onChange={(e) => setRamalExtension(e.target.value)}
                    placeholder="Ex: 1001"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Senha *</label>
                  <input
                    type="password"
                    value={ramalPassword}
                    onChange={(e) => setRamalPassword(e.target.value)}
                    placeholder={ramalExistente ? '••••••' : 'Senha do ramal'}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Servidor SIP</label>
                  <input
                    type="text"
                    value={ramalSipServer}
                    onChange={(e) => setRamalSipServer(e.target.value)}
                    placeholder="sip.api4com.com.br"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Nome de exibição</label>
                  <input
                    type="text"
                    value={ramalNome}
                    onChange={(e) => setRamalNome(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                onClick={handleSalvarRamal}
                disabled={salvandoRamal || (!ramalPassword && !ramalExistente)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {salvandoRamal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {ramalExistente ? 'Atualizar Ramal' : 'Salvar Ramal'}
              </button>

              {ramalResult && (
                <div className={`flex items-center gap-1.5 text-xs p-2 rounded-md ${
                  ramalResult.success
                    ? 'bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {ramalResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {ramalResult.message}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Carregando ramal...</span>
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  )
}
