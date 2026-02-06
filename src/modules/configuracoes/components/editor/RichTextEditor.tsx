/**
 * AIDEV-NOTE: Editor WYSIWYG reutilizável baseado no TipTap
 * Usado na assinatura de mensagem (ConfigGeralPage)
 * Suporta: formatação, imagens, tabelas, links, alinhamento
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import ImageExt from '@tiptap/extension-image'
import { Table as TableExt } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import LinkExt from '@tiptap/extension-link'
import { useEffect, useRef } from 'react'
import { EditorToolbar } from './EditorToolbar'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      UnderlineExt,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ImageExt.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto;',
        },
      }),
      TableExt.configure({
        resizable: false,
      }),
      TableRow,
      TableCell,
      TableHeader,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none px-4 py-3 min-h-[160px] focus:outline-none text-foreground',
      },
    },
    onUpdate: ({ editor: ed }) => {
      isInternalUpdate.current = true
      onChange(ed.getHTML())
    },
  })

  // Sincronizar valor externo (carregamento de dados do backend)
  useEffect(() => {
    if (editor && !isInternalUpdate.current) {
      const currentHtml = editor.getHTML()
      // Só atualiza se o conteúdo for realmente diferente
      if (value !== currentHtml && value !== undefined) {
        editor.commands.setContent(value || '')
      }
    }
    isInternalUpdate.current = false
  }, [value, editor])

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      {!value && !editor?.getText() && (
        <style>{`
          .ProseMirror p.is-editor-empty:first-child::before {
            content: '${placeholder || 'Comece a digitar...'}';
            color: hsl(var(--muted-foreground));
            float: left;
            pointer-events: none;
            height: 0;
          }
        `}</style>
      )}
      {/* Estilos para tabela e imagens dentro do editor */}
      <style>{`
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.5rem 0;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid hsl(var(--border));
          padding: 0.4rem 0.6rem;
          text-align: left;
          vertical-align: top;
          min-width: 80px;
        }
        .ProseMirror th {
          background: hsl(var(--muted));
          font-weight: 600;
          font-size: 0.8rem;
        }
        .ProseMirror td {
          font-size: 0.85rem;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 1rem 0;
        }
        .ProseMirror p {
          margin: 0.25rem 0;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.25rem;
        }
        .ProseMirror h3 {
          font-size: 1.05rem;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.25rem 0;
        }
        .ProseMirror .tableWrapper {
          overflow-x: auto;
        }
      `}</style>
    </div>
  )
}
