/**
 * AIDEV-NOTE: Card de QR Code gerado com Canvas API (sem lib externa)
 */

import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  slug: string
  baseUrl: string
}

export function QRCodeCard({ slug, baseUrl }: Props) {
  const [copied, setCopied] = useState(false)
  
  const url = `${baseUrl}/f/${slug}`

  // Simple QR code using a free API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = qrImageUrl
    link.download = `qrcode-${slug}.png`
    link.click()
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">QR Code</h3>

      <div className="flex flex-col items-center gap-3">
        <div className="bg-white p-3 rounded-lg">
          <img
            src={qrImageUrl}
            alt="QR Code do formulário"
            width={160}
            height={160}
            className="block"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyLink}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar link'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" />
            Baixar PNG
          </Button>
        </div>
      </div>
    </div>
  )
}
