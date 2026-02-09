/**
 * AIDEV-NOTE: Card de link direto com suporte a UTMs
 */

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  slug: string
  baseUrl: string
}

export function LinkDiretoCard({ slug, baseUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')

  const buildUrl = () => {
    const url = new URL(`${baseUrl}/f/${slug}`)
    if (utmSource) url.searchParams.set('utm_source', utmSource)
    if (utmMedium) url.searchParams.set('utm_medium', utmMedium)
    if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign)
    return url.toString()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildUrl())
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Link Direto</h3>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={buildUrl()}
          className="flex-1 bg-muted rounded-md px-3 py-2 text-xs text-foreground border border-border"
        />
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
          <a href={buildUrl()} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>

      {/* UTMs */}
      <details className="group">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          Adicionar UTMs (opcional)
        </summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Source</label>
            <input
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="google"
              className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Medium</label>
            <input
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              placeholder="cpc"
              className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Campaign</label>
            <input
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="lancamento"
              className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs"
            />
          </div>
        </div>
      </details>
    </div>
  )
}
