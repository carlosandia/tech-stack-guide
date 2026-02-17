/**
 * AIDEV-NOTE: Input de texto com suporte a emoji picker
 * Usado para o campo de assunto do email (cadência comercial)
 */

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmojiPicker } from '@/modules/conversas/components/EmojiPicker'

interface EmojiInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

export function EmojiInput({ value, onChange, placeholder, className, id }: EmojiInputProps) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

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

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current
    if (input) {
      const start = input.selectionStart ?? value.length
      const end = input.selectionEnd ?? value.length
      const newValue = value.slice(0, start) + emoji + value.slice(end)
      onChange(newValue)
      // Restore cursor position after emoji
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length)
        input.focus()
      }, 0)
    } else {
      onChange(value + emoji)
    }
    setEmojiOpen(false)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200',
          className
        )}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2" ref={emojiRef}>
        <button
          type="button"
          onClick={() => setEmojiOpen(!emojiOpen)}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Emoji"
        >
          <Smile className="w-4 h-4" />
        </button>
        {emojiOpen && (
          <div className="absolute right-0 bottom-full mb-1 z-50">
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setEmojiOpen(false)} />
          </div>
        )}
      </div>
    </div>
  )
}
