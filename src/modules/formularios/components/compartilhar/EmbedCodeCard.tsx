/**
 * AIDEV-NOTE: Card de código embed otimizado (loader via edge function)
 * Gera um <script src="..."> leve (~1 linha) que carrega o JS cacheável do servidor
 * Substitui o script inline gigante (~15KB) por um loader CDN-friendly
 */

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  slug: string
  baseUrl: string
}

type EmbedType = 'inline' | 'modal' | 'sidebar'

const EMBED_LABELS: Record<EmbedType, string> = {
  inline: 'Padrão (embutido)',
  modal: 'Modal (popup)',
  sidebar: 'Sidebar (lateral)',
}

const SUPABASE_URL = 'https://ybzhlsalbnxwkfszkloa.supabase.co'

function generateEmbedCode(slug: string, type: EmbedType): string {
  const loaderUrl = `${SUPABASE_URL}/functions/v1/widget-formulario-loader?slug=${slug}&mode=${type}`

  return `<!-- Formulário CRM Renove -->
<script data-form-slug="${slug}" src="${loaderUrl}" async></script>`
}

export function EmbedCodeCard({ slug }: Props) {
  const [type, setType] = useState<EmbedType>('inline')
  const [copied, setCopied] = useState(false)

  const code = generateEmbedCode(slug, type)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Código copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Código Embed</h3>

      <div className="flex gap-1 flex-wrap">
        {(Object.keys(EMBED_LABELS) as EmbedType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              type === t
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {EMBED_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-48 text-foreground">
          <code>{code}</code>
        </pre>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 h-7 gap-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-tight">
        💡 O script é dinâmico e cacheável — alterações no formulário refletem automaticamente. O JS é servido via CDN com cache de 1h.
      </p>
    </div>
  )
}
