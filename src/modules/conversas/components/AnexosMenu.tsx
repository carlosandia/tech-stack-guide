/**
 * AIDEV-NOTE: Menu popup de anexos (PRD-09 RF-006)
 * Aparece acima do botão clip no ChatInput
 * Opções: Documento, Fotos/Vídeos, Câmera, Áudio, Contato, Enquete
 */

import { useRef } from 'react'
import { FileText, Image, Camera, Mic, User, BarChart3, X } from 'lucide-react'

interface AnexosMenuProps {
  isOpen: boolean
  onClose: () => void
  onFileSelected: (file: File, tipo: string) => void
}

interface MenuOption {
  icon: React.ElementType
  label: string
  accept?: string
  disabled?: boolean
  disabledLabel?: string
  tipo: string
}

const menuOptions: MenuOption[] = [
  { icon: FileText, label: 'Documento', accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.txt', tipo: 'document' },
  { icon: Image, label: 'Fotos e Vídeos', accept: 'image/*,video/*', tipo: 'image' },
  { icon: Camera, label: 'Câmera', disabled: true, disabledLabel: 'Em breve', tipo: 'image' },
  { icon: Mic, label: 'Áudio', disabled: true, disabledLabel: 'Em breve', tipo: 'audio' },
  { icon: User, label: 'Contato', disabled: true, disabledLabel: 'Em breve', tipo: 'contact' },
  { icon: BarChart3, label: 'Enquete', disabled: true, disabledLabel: 'Em breve', tipo: 'poll' },
]

export function AnexosMenu({ isOpen, onClose, onFileSelected }: AnexosMenuProps) {
  const docInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleOptionClick = (option: MenuOption) => {
    if (option.disabled) return

    if (option.label === 'Documento') {
      docInputRef.current?.click()
    } else if (option.label === 'Fotos e Vídeos') {
      mediaInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Detectar tipo baseado no mimetype
    let detectedTipo = tipo
    if (file.type.startsWith('image/')) detectedTipo = 'image'
    else if (file.type.startsWith('video/')) detectedTipo = 'video'
    else if (file.type.startsWith('audio/')) detectedTipo = 'audio'
    else detectedTipo = 'document'

    onFileSelected(file, detectedTipo)
    onClose()

    // Reset input
    e.target.value = ''
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[300]" onClick={onClose} />

      {/* Menu popup - responsivo (GAP 6) */}
      <div className="absolute bottom-full left-0 right-0 sm:right-auto mb-1 z-[301] bg-white/95 backdrop-blur-md border border-border rounded-lg shadow-lg w-full sm:w-52">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <span className="text-xs font-medium text-foreground">Anexar</span>
          <button onClick={onClose} className="p-0.5 hover:bg-accent rounded">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Options */}
        <div className="py-1">
          {menuOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-left text-xs">{option.label}</span>
                {option.disabled && (
                  <span className="text-[10px] text-muted-foreground italic">{option.disabledLabel}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={docInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.txt"
        onChange={(e) => handleFileChange(e, 'document')}
      />
      <input
        ref={mediaInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={(e) => handleFileChange(e, 'image')}
      />
    </>
  )
}
