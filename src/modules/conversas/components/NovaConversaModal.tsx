/**
 * AIDEV-NOTE: Modal para iniciar nova conversa (WhatsApp)
 */

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { useCriarConversa } from '../hooks/useConversas'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'

interface NovaConversaModalProps {
  isOpen: boolean
  onClose: () => void
  onConversaCriada: (id: string) => void
}

export function NovaConversaModal({ isOpen, onClose, onConversaCriada }: NovaConversaModalProps) {
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [canal, setCanal] = useState<'whatsapp' | 'instagram'>('whatsapp')

  const criarConversa = useCriarConversa()

  const handleSubmit = () => {
    if (!telefone.trim() || !mensagem.trim()) return

    criarConversa.mutate(
      {
        telefone: telefone.trim(),
        canal,
        mensagem_inicial: mensagem.trim(),
      },
      {
        onSuccess: (data) => {
          onConversaCriada(data.id)
          onClose()
          setTelefone('')
          setMensagem('')
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <ModalBase
      onClose={onClose}
      title="Nova Conversa"
      description="Inicie uma conversa com um contato"
      icon={MessageSquare}
      variant="create"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-md transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!telefone.trim() || !mensagem.trim() || criarConversa.isPending}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50 transition-all duration-200"
          >
            {criarConversa.isPending ? 'Iniciando...' : 'Iniciar Conversa'}
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Canal selector */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Canal</label>
          <div className="flex gap-2">
            <button
              onClick={() => setCanal('whatsapp')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all duration-200 ${
                canal === 'whatsapp'
                  ? 'border-[#25D366] bg-[#25D366]/10 text-[#25D366]'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              <WhatsAppIcon size={16} />
              WhatsApp
            </button>
            <button
              onClick={() => setCanal('instagram')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all duration-200 ${
                canal === 'instagram'
                  ? 'border-purple-500 bg-purple-50 text-purple-600'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </button>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {canal === 'whatsapp' ? 'Telefone (com DDD)' : 'Usuário do Instagram'}
          </label>
          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder={canal === 'whatsapp' ? '+5511999999999' : '@usuario'}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Mensagem inicial</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Digite a primeira mensagem..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </ModalBase>
  )
}
