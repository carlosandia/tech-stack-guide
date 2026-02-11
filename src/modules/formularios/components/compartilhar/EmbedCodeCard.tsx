/**
 * AIDEV-NOTE: Card de código embed (inline, modal, sidebar)
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

function generateEmbedCode(slug: string, baseUrl: string, type: EmbedType): string {
  const url = `${baseUrl}/f/${slug}`

  if (type === 'inline') {
    return `<iframe 
  src="${url}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border:none;max-width:600px;margin:0 auto;display:block;">
</iframe>`
  }

  if (type === 'modal') {
    return `<script>
(function() {
  var btn = document.createElement('button');
  btn.textContent = 'Abrir Formulário';
  btn.style.cssText = 'padding:12px 24px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;';
  btn.onclick = function() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    var iframe = document.createElement('iframe');
    iframe.src = '${url}';
    iframe.style.cssText = 'width:90%;max-width:600px;height:80vh;border:none;border-radius:8px;';
    overlay.appendChild(iframe);
    overlay.onclick = function(e) { if(e.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  };
  document.currentScript.parentNode.insertBefore(btn, document.currentScript);
})();
</script>`
  }

  // sidebar
  return `<script>
(function() {
  var toggle = document.createElement('button');
  toggle.textContent = '📋';
  toggle.style.cssText = 'position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9998;padding:12px;background:#3B82F6;color:#fff;border:none;border-radius:8px 0 0 8px;cursor:pointer;font-size:18px;';
  var panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;right:-400px;top:0;width:400px;height:100%;z-index:9999;transition:right 0.3s;box-shadow:-2px 0 10px rgba(0,0,0,0.1);';
  var iframe = document.createElement('iframe');
  iframe.src = '${url}';
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  panel.appendChild(iframe);
  var open = false;
  toggle.onclick = function() {
    open = !open;
    panel.style.right = open ? '0' : '-400px';
  };
  document.body.appendChild(toggle);
  document.body.appendChild(panel);
})();
</script>`
}

export function EmbedCodeCard({ slug, baseUrl }: Props) {
  const [type, setType] = useState<EmbedType>('inline')
  const [copied, setCopied] = useState(false)

  const code = generateEmbedCode(slug, baseUrl, type)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Código copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Código Embed</h3>

      <div className="flex gap-1">
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
    </div>
  )
}
