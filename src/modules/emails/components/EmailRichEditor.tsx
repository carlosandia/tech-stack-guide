/**
 * AIDEV-NOTE: Editor TipTap reutilizável para composição de emails e assinatura
 * Toolbar: Bold, Italic, Underline, Link, Listas
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
}: EmailRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none text-foreground [&_p]:my-1',
        style: `min-height: ${minHeight}`,
      },
    },
  })

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
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Negrito">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Itálico">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Sublinhado">
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Lista">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={handleLink} className={btnClass(editor.isActive('link'))} title="Link">
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  )
}
