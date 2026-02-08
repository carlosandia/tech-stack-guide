/**
 * AIDEV-NOTE: Barra de busca inline para filtrar mensagens na conversa
 */

import { useState, useRef, useEffect } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'

interface BuscaMensagensBarProps {
  onClose: () => void
  onSearch: (termo: string) => void
  totalResults: number
  currentIndex: number
  onPrev: () => void
  onNext: () => void
}

export function BuscaMensagensBar({
  onClose,
  onSearch,
  totalResults,
  currentIndex,
  onPrev,
  onNext,
}: BuscaMensagensBarProps) {
  const [termo, setTermo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = (value: string) => {
    setTermo(value)
    onSearch(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrev()
      } else {
        onNext()
      }
    }
  }

  return (
    <div className="flex-shrink-0 bg-card border-b border-border px-3 py-2 flex items-center gap-2 animate-fade-in">
      <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={termo}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar na conversa..."
        className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground"
      />
      {termo && totalResults > 0 && (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {currentIndex + 1}/{totalResults}
        </span>
      )}
      {termo && totalResults > 0 && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrev}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Anterior (Shift+Enter)"
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={onNext}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Próximo (Enter)"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
      {termo && totalResults === 0 && (
        <span className="text-xs text-muted-foreground flex-shrink-0">Sem resultados</span>
      )}
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-accent transition-colors"
        title="Fechar busca (Esc)"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}
