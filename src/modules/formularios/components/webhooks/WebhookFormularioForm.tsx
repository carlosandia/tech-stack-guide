/**
 * AIDEV-NOTE: Form de criar/editar webhook de formulário
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onCriar: (payload: {
    nome_webhook: string
    url_webhook: string
    metodo_http?: string
    retry_ativo?: boolean
    max_tentativas?: number
    incluir_metadados?: boolean
  }) => void
  loading?: boolean
}

export function WebhookFormularioForm({ onCriar, loading }: Props) {
  const [nome, setNome] = useState('')
  const [url, setUrl] = useState('')
  const [metodo, setMetodo] = useState('POST')
  const [retryAtivo, setRetryAtivo] = useState(true)
  const [maxTentativas, setMaxTentativas] = useState(3)
  const [incluirMetadados, setIncluirMetadados] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !url.trim()) return
    // AIDEV-NOTE: Seg — validação SSRF: bloquear protocolos não-HTTP e IPs internos
    try {
      const parsed = new URL(url.trim())
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        toast.error('Apenas URLs HTTP/HTTPS são permitidas')
        return
      }
      if (/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|0\.0\.0\.0|::1)/.test(parsed.hostname)) {
        toast.error('URLs internas/privadas não são permitidas')
        return
      }
    } catch {
      toast.error('URL inválida')
      return
    }
    onCriar({
      nome_webhook: nome.trim(),
      url_webhook: url.trim(),
      metodo_http: metodo,
      retry_ativo: retryAtivo,
      max_tentativas: maxTentativas,
      incluir_metadados: incluirMetadados,
    })
    setNome('')
    setUrl('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-border bg-card">
      <h4 className="text-xs font-semibold text-foreground">Novo Webhook</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nome</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Notificar CRM externo"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.exemplo.com/webhook"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Método</Label>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Máx. tentativas</Label>
          <Input
            type="number"
            value={maxTentativas}
            onChange={(e) => setMaxTentativas(Number(e.target.value))}
            min={1}
            max={10}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <Switch checked={retryAtivo} onCheckedChange={setRetryAtivo} />
          <Label className="text-xs">Retry</Label>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <Switch checked={incluirMetadados} onCheckedChange={setIncluirMetadados} />
          <Label className="text-xs">Metadados</Label>
        </div>
      </div>

      <Button type="submit" size="sm" disabled={!nome.trim() || !url.trim() || loading} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        Criar Webhook
      </Button>
    </form>
  )
}
