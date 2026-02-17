/**
 * AIDEV-NOTE: Editor de mensagem para Cadência Comercial
 * Suporta: Emoji, Bold, Italic, Underline, Imagem
 * Compatível com Email (HTML) e WhatsApp (markdown WhatsApp)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import ResizeImage from 'tiptap-extension-resize-image'
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImagePlus,
  Smile,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { EmojiPicker } from '@/modules/conversas/components/EmojiPicker'

interface CadenciaMessageEditorProps {
  content: string
  onChange: (html: string) => void
  mode: 'email' | 'whatsapp'
  placeholder?: string
  minHeight?: string
  className?: string
}

function LinkInputInline({ onConfirm, onCancel }: { onConfirm: (url: string) => void; onCancel: () => void }) {
  const [url, setUrl] = useState('')
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border/60 bg-muted/20">
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onConfirm(url); if (e.key === 'Escape') onCancel() }}
        placeholder="https://exemplo.com"
        className="flex-1 h-7 px-2 text-xs rounded border border-input bg-background text-foreground placeholder:text-muted-foreground"
        autoFocus
      />
      <button type="button" onClick={() => onConfirm(url)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        Inserir
      </button>
      <button type="button" onClick={onCancel} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors">
        Cancelar
      </button>
    </div>
  )
}

export function CadenciaMessageEditor({
  content,
  onChange,
  mode,
  placeholder: _placeholder,
  minHeight = '120px',
  className,
}: CadenciaMessageEditorProps) {
  void _placeholder
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // WhatsApp suporta bold, italic, strikethrough
        // Email suporta tudo
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      ResizeImage,
    ],
    content: content || '',
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none text-foreground [&_p]:my-1 [&_img]:inline-block [&_img]:max-w-full',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close emoji on outside click
  useEffect(() => {
    if (!emojiOpen) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [emojiOpen])

  const handleEmojiSelect = useCallback((emoji: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(emoji).run()
    setEmojiOpen(false)
  }, [editor])

  const handleImageUpload = useCallback(() => {
    if (!editor || uploading) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const ext = file.name.split('.').pop()
        const path = `email-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { data, error } = await supabase.storage
          .from('email-anexos')
          .upload(path, file, { contentType: file.type, upsert: true })

        if (error) {
          const reader = new FileReader()
          reader.onload = () => {
            editor.chain().focus().setImage({ src: reader.result as string }).run()
          }
          reader.readAsDataURL(file)
          return
        }

        const { data: urlData } = supabase.storage
          .from('email-anexos')
          .getPublicUrl(data.path)

        editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }, [editor, uploading])

  const [showLinkInput, setShowLinkInput] = useState(false)

  const handleLink = useCallback(() => {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    setShowLinkInput(true)
  }, [editor])

  const handleLinkConfirm = useCallback((url: string) => {
    if (editor && url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
    setShowLinkInput(false)
  }, [editor])

  if (!editor) return null

  const btnClass = (active: boolean) =>
    cn(
      'p-1.5 rounded hover:bg-accent transition-colors',
      active ? 'bg-accent text-primary' : 'text-muted-foreground'
    )

  return (
    <div className={cn('border border-input rounded-md bg-background', className)} style={{ overflow: 'visible', position: 'relative' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/60 bg-muted/30 flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Negrito">
          <BoldIcon className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Itálico">
          <ItalicIcon className="w-4 h-4" />
        </button>
        {mode === 'email' && (
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Sublinhado">
            <UnderlineIcon className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        {mode === 'email' && (
          <>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Lista">
              <List className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Lista numerada">
              <ListOrdered className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleLink} className={btnClass(editor.isActive('link'))} title="Link">
              <LinkIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
          </>
        )}

        <button type="button" onClick={handleImageUpload} className={btnClass(false)} title="Inserir imagem" disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </button>

        {/* Emoji */}
        <div className="relative" ref={emojiRef}>
          <button type="button" onClick={() => setEmojiOpen(!emojiOpen)} className={btnClass(emojiOpen)} title="Emoji">
            <Smile className="w-4 h-4" />
          </button>
          {emojiOpen && (
            <div className="absolute left-0 bottom-full mb-1" style={{ zIndex: 9999 }}>
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setEmojiOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Inline link input */}
      {showLinkInput && (
        <LinkInputInline onConfirm={handleLinkConfirm} onCancel={() => setShowLinkInput(false)} />
      )}

      {/* Editor */}
      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  )
}

/**
 * Converte HTML do TipTap para formatação WhatsApp
 * *bold* _italic_ ~strikethrough~
 */
export function htmlToWhatsApp(html: string): string {
  if (!html) return ''
  let text = html
  // Remove image tags (handled separately)
  text = text.replace(/<img[^>]*>/gi, '')
  // Bold
  text = text.replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
  text = text.replace(/<b>(.*?)<\/b>/gi, '*$1*')
  // Italic
  text = text.replace(/<em>(.*?)<\/em>/gi, '_$1_')
  text = text.replace(/<i>(.*?)<\/i>/gi, '_$1_')
  // Strikethrough
  text = text.replace(/<s>(.*?)<\/s>/gi, '~$1~')
  text = text.replace(/<del>(.*?)<\/del>/gi, '~$1~')
  // Line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>\s*<p>/gi, '\n\n')
  // Lists
  text = text.replace(/<li>(.*?)<\/li>/gi, '• $1\n')
  // Strip remaining HTML tags
  text = text.replace(/<[^>]*>/g, '')
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&quot;/g, '"')
  // Trim extra whitespace
  return text.trim()
}

/**
 * Extrai URLs de imagens do HTML
 */
export function extractImagesFromHtml(html: string): string[] {
  if (!html) return []
  const urls: string[] = []
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    if (match[1] && !match[1].startsWith('data:')) {
      urls.push(match[1])
    }
  }
  return urls
}
