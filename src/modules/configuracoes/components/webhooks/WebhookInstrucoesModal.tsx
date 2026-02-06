/**
 * AIDEV-NOTE: Modal de instruções do Webhook de Entrada
 * Instruções claras e objetivas para integração via webhook
 * Usa ModalBase para conformidade com Design System
 */

import { ModalBase } from '../ui/ModalBase'
import { HelpCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface WebhookInstrucoesModalProps {
  onClose: () => void
  webhookUrl: string
  apiKey: string
}

export function WebhookInstrucoesModal({ onClose, webhookUrl, apiKey }: WebhookInstrucoesModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    toast.success('Copiado!')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: ${apiKey}" \\
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-0000",
    "empresa": "Empresa Ltda",
    "origem": "formulario_site",
    "observacoes": "Interessado no plano Pro"
  }'`

  const jsonExample = `{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-0000",
  "empresa": "Empresa Ltda",
  "origem": "formulario_site",
  "observacoes": "Interessado no plano Pro"
}`

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <button
      onClick={() => handleCopy(value, field)}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted transition-colors"
      title="Copiar"
    >
      {copiedField === field ? (
        <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  )

  return (
    <ModalBase
      onClose={onClose}
      title="Como usar o Webhook"
      description="Guia rápido de integração"
      icon={HelpCircle}
      variant="edit"
      size="lg"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Entendi
          </button>
        </div>
      }
    >
      <div className="px-4 sm:px-6 py-5 space-y-6">
        {/* Passo 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            <h3 className="text-sm font-semibold text-foreground">Copie a Webhook URL</h3>
          </div>
          <p className="text-xs text-muted-foreground ml-8">
            Cole esta URL como destino no <strong>N8N</strong>, <strong>Zapier</strong>, <strong>Make.com</strong> ou qualquer plataforma de automação.
          </p>
        </div>

        {/* Passo 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            <h3 className="text-sm font-semibold text-foreground">Configure a autenticação</h3>
          </div>
          <p className="text-xs text-muted-foreground ml-8">
            Inclua a API Key em um destes headers:
          </p>
          <div className="ml-8 space-y-1.5">
            <code className="block text-xs bg-muted px-3 py-1.5 rounded-md font-mono text-foreground">
              X-Api-Key: {apiKey ? `${apiKey.substring(0, 12)}...` : '<sua_api_key>'}
            </code>
            <p className="text-xs text-muted-foreground">ou</p>
            <code className="block text-xs bg-muted px-3 py-1.5 rounded-md font-mono text-foreground">
              Authorization: Bearer {'<sua_api_key>'}
            </code>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            <h3 className="text-sm font-semibold text-foreground">Envie os dados como JSON (POST)</h3>
          </div>
          <p className="text-xs text-muted-foreground ml-8">
            Campos aceitos:
          </p>
          <div className="ml-8 relative">
            <CopyButton value={jsonExample} field="json" />
            <pre className="p-3 pr-10 rounded-md bg-muted text-xs font-mono text-foreground overflow-x-auto">
{jsonExample}
            </pre>
          </div>
          <div className="ml-8">
            <p className="text-xs text-muted-foreground">
              <strong>Aliases aceitos:</strong> name → nome, phone/whatsapp → telefone, company → empresa, source → origem
            </p>
          </div>
        </div>

        {/* Passo 4 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            <h3 className="text-sm font-semibold text-foreground">Habilite o webhook</h3>
          </div>
          <p className="text-xs text-muted-foreground ml-8">
            Ative o toggle na página para começar a receber leads automaticamente.
          </p>
        </div>

        {/* Exemplo cURL */}
        <div className="border-t border-border pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Exemplo com cURL</h3>
          <div className="relative">
            <CopyButton value={curlExample} field="curl" />
            <pre className="p-3 pr-10 rounded-md bg-muted text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
{curlExample}
            </pre>
          </div>
        </div>
      </div>
    </ModalBase>
  )
}
