/**
 * AIDEV-NOTE: Editor TipTap reutilizável para composição de emails e assinatura
 * Toolbar: Bold, Italic, Underline, Link, Listas, Imagem (upload + resize), HTML source
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import ResizeImage from 'tiptap-extension-resize-image'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  ImagePlus,
  Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/shared/utils/compressMedia'

interface EmailRichEditorProps {
  content?: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function EmailRichEditor({
  content,
  onChange,
  className,
  minHeight = '120px',
}: EmailRichEditorProps) {
  const [htmlMode, setHtmlMode] = useState(false)
  const [rawHtml, setRawHtml] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
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
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none text-foreground [&_p]:my-1 [&_img]:inline-block [&_img]:max-w-full',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  const handleImageUpload = useCallback(() => {
    if (!editor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // AIDEV-NOTE: Seg #9 — validar MIME type real (não confiar apenas no accept do input)
      if (!file.type.startsWith('image/') || ['image/svg+xml', 'image/x-icon'].includes(file.type)) {
        toast.error('Apenas imagens JPG, PNG, GIF ou WebP são permitidas')
        return
      }

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 2MB')
        return
      }

      // AIDEV-NOTE: Buscar organizacao_id para path RLS-compatível
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Usuário não autenticado'); return }
      const { data: orgData } = await supabase
        .from('usuarios')
        .select('organizacao_id')
        .eq('auth_id', user.id)
        .maybeSingle()
      const orgId = orgData?.organizacao_id
      if (!orgId) { toast.error('Organização não encontrada'); return }

      // AIDEV-NOTE: Comprimir imagem antes do upload
      const compressed = await compressImage(file, file.name)

      // Upload to Supabase storage
      const safeExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp' }[file.type] || 'bin'
      // AIDEV-NOTE: Path com organizacao_id como primeiro segmento para cumprir RLS do bucket
      const path = `${orgId}/email-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`

      const { data, error } = await supabase.storage
        .from('assinaturas')
        .upload(path, compressed, { contentType: compressed instanceof File ? compressed.type : file.type })

      if (error) {
        // Fallback to base64 if storage fails
        const reader = new FileReader()
        reader.onload = () => {
          editor.chain().focus().setImage({ src: reader.result as string }).run()
        }
        reader.readAsDataURL(file)
        return
      }

      const { data: urlData } = supabase.storage
        .from('assinaturas')
        .getPublicUrl(data.path)

      editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
    }
    input.click()
  }, [editor])

  const toggleHtmlMode = () => {
    if (!editor) return
    if (htmlMode) {
      editor.commands.setContent(rawHtml)
      onChange(rawHtml)
      setHtmlMode(false)
    } else {
      setRawHtml(editor.getHTML())
      setHtmlMode(true)
    }
  }

  if (!editor) return null

  const btnClass = (active: boolean) =>
    cn(
      'p-1.5 rounded hover:bg-accent transition-colors',
      active ? 'bg-accent text-primary' : 'text-muted-foreground'
    )

  const handleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt('URL do link:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className={cn('border border-input rounded-md overflow-hidden bg-background', className)}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/60 bg-muted/30">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Negrito" disabled={htmlMode}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Itálico" disabled={htmlMode}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Sublinhado" disabled={htmlMode}>
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Lista" disabled={htmlMode}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Lista numerada" disabled={htmlMode}>
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={handleLink} className={btnClass(editor.isActive('link'))} title="Link" disabled={htmlMode}>
          <LinkIcon className="w-4 h-4" />
        </button>
        <button type="button" onClick={handleImageUpload} className={btnClass(false)} title="Inserir imagem" disabled={htmlMode}>
          <ImagePlus className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={toggleHtmlMode} className={btnClass(htmlMode)} title="Editar HTML">
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      {htmlMode ? (
        <textarea
          value={rawHtml}
          onChange={(e) => setRawHtml(e.target.value)}
          className="w-full px-3 py-2 text-xs font-mono bg-background text-foreground focus:outline-none resize-none"
          style={{ minHeight }}
        />
      ) : (
        <EditorContent editor={editor} className="px-3 py-2" />
      )}
    </div>
  )
}
