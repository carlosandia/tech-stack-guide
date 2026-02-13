/**
 * AIDEV-NOTE: Menu popup de anexos com ícones coloridos estilo WhatsApp Web (PRD-09 RF-006)
 * Opções: Documento, Fotos/Vídeos, Câmera, Áudio, Contato, Enquete
 */

import { useRef } from 'react'
import { FileText, Image, Camera, Mic, User, BarChart3, X } from 'lucide-react'

interface AnexosMenuProps {
  isOpen: boolean
  onClose: () => void
  onFileSelected: (file: File, tipo: string) => void
  onAudioRecord: () => void
  onCamera: () => void
  onContato: () => void
  onEnquete: () => void
}

interface MenuOption {
  icon: React.ElementType
  label: string
  color: string
  bgColor: string
  accept?: string
  tipo: string
  action: 'file-doc' | 'file-media' | 'audio' | 'camera' | 'contato' | 'enquete'
}

const menuOptions: MenuOption[] = [
  { icon: FileText, label: 'Documento', color: '#7C3AED', bgColor: '#7C3AED15', accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.txt', tipo: 'document', action: 'file-doc' },
  { icon: Image, label: 'Fotos e Vídeos', color: '#2563EB', bgColor: '#2563EB15', accept: 'image/*,video/*', tipo: 'image', action: 'file-media' },
  { icon: Camera, label: 'Câmera', color: '#EF4444', bgColor: '#EF444415', tipo: 'image', action: 'camera' },
  { icon: Mic, label: 'Áudio', color: '#F97316', bgColor: '#F9731615', tipo: 'audio', action: 'audio' },
  { icon: User, label: 'Contato', color: '#1D4ED8', bgColor: '#1D4ED815', tipo: 'contact', action: 'contato' },
  { icon: BarChart3, label: 'Enquete', color: '#16A34A', bgColor: '#16A34A15', tipo: 'poll', action: 'enquete' },
]

export function AnexosMenu({ isOpen, onClose, onFileSelected, onAudioRecord, onCamera, onContato, onEnquete }: AnexosMenuProps) {
  const docInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleOptionClick = (option: MenuOption) => {
    switch (option.action) {
      case 'file-doc':
        docInputRef.current?.click()
        break
      case 'file-media':
        mediaInputRef.current?.click()
        break
      case 'audio':
        onAudioRecord()
        onClose()
        break
      case 'camera':
        onCamera()
        onClose()
        break
      case 'contato':
        onContato()
        onClose()
        break
      case 'enquete':
        onEnquete()
        onClose()
        break
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      let detectedTipo = tipo
      if (file.type.startsWith('image/')) detectedTipo = 'image'
      else if (file.type.startsWith('video/')) detectedTipo = 'video'
      else if (file.type.startsWith('audio/')) detectedTipo = 'audio'
      else detectedTipo = 'document'

      onFileSelected(file, detectedTipo)
    }
    onClose()
    e.target.value = ''
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[300]" onClick={onClose} />

      {/* Menu popup — fundo sólido, sem transparência */}
      <div className="absolute bottom-full left-0 mb-1 z-[301] bg-white border border-border rounded-lg shadow-xl w-56">
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
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 transition-all duration-200"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: option.bgColor }}
                >
                  <Icon className="w-4 h-4" style={{ color: option.color }} />
                </div>
                <span className="text-xs font-medium">{option.label}</span>
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
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.txt,.ppt,.pptx"
        multiple
        onChange={(e) => handleFileChange(e, 'document')}
      />
      <input
        ref={mediaInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFileChange(e, 'image')}
      />
    </>
  )
}
