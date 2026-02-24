/**
 * AIDEV-NOTE: Toolbar do editor TipTap para assinatura de mensagem
 * Formatação completa: texto, headings, listas, alinhamento, imagem, tabela, link
 */

import { type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Table,
  Minus,
  Undo,
  Redo,
  Plus,
  Trash2,
  Unlink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors duration-150',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5" />
}

// AIDEV-NOTE: Seg — whitelist de MIME types seguros para upload (previne SVG/XML com XSS)
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  const addLink = () => {
    if (!linkUrl) return
    // AIDEV-NOTE: Seg — whitelist de protocolos seguros (previne javascript: XSS)
    const lower = linkUrl.toLowerCase().trim()
    const SAFE_PROTOCOLS = ['http://', 'https://', 'mailto:', 'tel:']
    if (lower.includes(':') && !SAFE_PROTOCOLS.some(p => lower.startsWith(p))) {
      toast.error('URL inválida: use http://, https://, mailto: ou tel:')
      setLinkUrl('')
      setShowLinkInput(false)
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl.trim() })
      .run()
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // AIDEV-NOTE: Seg — whitelist de MIME types (SVG/XML podem conter XSS; file.type é falsificável
    // mas bloqueia os tipos perigosos e a extensão é derivada do MIME, não do nome)
    if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
      toast.error('Apenas imagens JPEG, PNG, GIF ou WebP são permitidas')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB')
      return
    }

    setUploading(true)
    try {
      // AIDEV-NOTE: Seg — extensão derivada do MIME (não do filename — previne path traversal)
      const ext = MIME_TO_EXT[file.type] || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const filePath = `assinaturas/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('assinaturas')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('assinaturas')
        .getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        editor.chain().focus().insertContent({
          type: 'imageResize',
          attrs: { src: urlData.publicUrl },
        }).run()
        toast.success('Imagem inserida com sucesso')
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      toast.error('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const iconSize = 15

  return (
    <div className="border-b border-border bg-muted/30 px-2 py-1.5 space-y-1.5">
      {/* Linha principal */}
      <div className="flex flex-wrap items-center gap-0.5">
        {/* Formatação de texto */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito"
        >
          <Bold size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Itálico"
        >
          <Italic size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Sublinhado"
        >
          <Underline size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título H2"
        >
          <Heading2 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Título H3"
        >
          <Heading3 size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista não-ordenada"
        >
          <List size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista ordenada"
        >
          <ListOrdered size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Alinhamento */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Alinhar à esquerda"
        >
          <AlignLeft size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
        >
          <AlignCenter size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Alinhar à direita"
        >
          <AlignRight size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('link')) {
              removeLink()
            } else {
              setShowLinkInput(!showLinkInput)
            }
          }}
          isActive={editor.isActive('link')}
          title={editor.isActive('link') ? 'Remover link' : 'Inserir link'}
        >
          {editor.isActive('link') ? <Unlink size={iconSize} /> : <Link size={iconSize} />}
        </ToolbarButton>

        {/* Imagem (upload) */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Fazer upload de imagem"
        >
          {uploading ? <Loader2 size={iconSize} className="animate-spin" /> : <Image size={iconSize} />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Tabela */}
        <ToolbarButton
          onClick={insertTable}
          isActive={editor.isActive('table')}
          title="Inserir tabela 3x3"
        >
          <Table size={iconSize} />
        </ToolbarButton>

        {/* Separador */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Separador horizontal"
        >
          <Minus size={iconSize} />
        </ToolbarButton>

        <Divider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer"
        >
          <Undo size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer"
        >
          <Redo size={iconSize} />
        </ToolbarButton>
      </div>

      {/* Controles de tabela (visíveis apenas quando cursor está na tabela) */}
      {editor.isActive('table') && (
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground mr-1">Tabela:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="text-xs px-2 py-0.5 rounded border border-border bg-background hover:bg-accent text-foreground transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Coluna
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="text-xs px-2 py-0.5 rounded border border-border bg-background hover:bg-accent text-foreground transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Linha
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="text-xs px-2 py-0.5 rounded border border-border bg-background hover:bg-accent text-destructive transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} /> Coluna
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="text-xs px-2 py-0.5 rounded border border-border bg-background hover:bg-accent text-destructive transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} /> Linha
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="text-xs px-2 py-0.5 rounded border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} /> Tabela
          </button>
        </div>
      )}

      {/* Input de Link (condicional) */}
      {showLinkInput && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLink()}
            placeholder="https://exemplo.com"
            className="flex-1 h-7 px-2 text-xs rounded border border-input bg-background text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            type="button"
            onClick={addLink}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Inserir
          </button>
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setLinkUrl('') }}
            className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

    </div>
  )
}
