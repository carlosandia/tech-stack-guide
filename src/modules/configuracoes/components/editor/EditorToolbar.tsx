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
import { useState } from 'react'

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

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  if (!editor) return null

  const addLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
    }
    setImageUrl('')
    setShowImageInput(false)
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
              setShowImageInput(false)
            }
          }}
          isActive={editor.isActive('link')}
          title={editor.isActive('link') ? 'Remover link' : 'Inserir link'}
        >
          {editor.isActive('link') ? <Unlink size={iconSize} /> : <Link size={iconSize} />}
        </ToolbarButton>

        {/* Imagem */}
        <ToolbarButton
          onClick={() => {
            setShowImageInput(!showImageInput)
            setShowLinkInput(false)
          }}
          title="Inserir imagem por URL"
        >
          <Image size={iconSize} />
        </ToolbarButton>

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

      {/* Input de Imagem (condicional) */}
      {showImageInput && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addImage()}
            placeholder="https://exemplo.com/imagem.png"
            className="flex-1 h-7 px-2 text-xs rounded border border-input bg-background text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            type="button"
            onClick={addImage}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Inserir
          </button>
          <button
            type="button"
            onClick={() => { setShowImageInput(false); setImageUrl('') }}
            className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
