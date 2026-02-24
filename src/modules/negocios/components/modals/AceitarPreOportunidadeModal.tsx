/**
 * AIDEV-NOTE: Modal para aceitar pré-oportunidade (RF-11)
 * Exibe dados do lead WhatsApp e permite criar oportunidade
 */

import { useState, useEffect, useRef } from 'react'
import { X, Phone, MessageCircle, User, Loader2 } from 'lucide-react'
import type { PreOportunidadeCard } from '../../services/pre-oportunidades.api'
import { getValidWhatsAppUrl } from '@/shared/utils/whatsapp-url'
import { useAceitarPreOportunidade } from '../../hooks/usePreOportunidades'
import { negociosApi } from '../../services/negocios.api'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

interface AceitarPreOportunidadeModalProps {
  preOp: PreOportunidadeCard
  funilId: string
  onClose: () => void
  onRejeitar: () => void
}

export function AceitarPreOportunidadeModal({ preOp, funilId: _funilId, onClose, onRejeitar }: AceitarPreOportunidadeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const aceitar = useAceitarPreOportunidade()

  const [titulo, setTitulo] = useState(preOp.phone_name || preOp.phone_number)
  const [contatoNome, setContatoNome] = useState(preOp.phone_name || '')
  const [contatoEmail, setContatoEmail] = useState('')
  const [valor, setValor] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [fotoError, setFotoError] = useState(false)
  const fotoUrlValida = getValidWhatsAppUrl(preOp.profile_picture_url)

  // Buscar membros
  const { data: membros } = useQuery({
    queryKey: ['membros_tenant'],
    queryFn: () => negociosApi.listarMembros(),
    staleTime: 60 * 1000,
  })

  // ESC
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handle)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleAceitar = async () => {
    try {
      await aceitar.mutateAsync({
        preOpId: preOp.id,
        payload: {
          titulo: titulo.trim() || preOp.phone_number,
          contato_nome: contatoNome.trim() || undefined,
          contato_email: contatoEmail.trim() || undefined,
          valor: valor ? parseFloat(valor) : undefined,
          usuario_responsavel_id: responsavelId || undefined,
        },
      })
      toast.success('Oportunidade criada com sucesso!')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aceitar solicitação')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg w-[calc(100%-16px)] sm:max-w-lg max-h-[90vh] overflow-y-auto animate-enter"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Aceitar Solicitação</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info do lead */}
          <div className="px-6 py-4 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              {fotoUrlValida && !fotoError ? (
                <img src={fotoUrlValida} alt="" className="w-10 h-10 rounded-full object-cover" onError={() => setFotoError(true)} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {preOp.phone_name || preOp.phone_number}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {preOp.phone_number}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {preOp.total_mensagens} msgs
                  </span>
                </div>
              </div>
            </div>
            {preOp.ultima_mensagem && (
              <p className="mt-2 text-xs text-muted-foreground bg-background rounded-md p-2 border border-border italic">
                "{preOp.ultima_mensagem}"
              </p>
            )}
          </div>

          {/* Form */}
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Título da oportunidade</label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Nome do negócio..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nome do contato</label>
                <input
                  type="text"
                  value={contatoNome}
                  onChange={e => setContatoNome(e.target.value)}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nome..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">E-mail</label>
                <input
                  type="email"
                  value={contatoEmail}
                  onChange={e => setContatoEmail(e.target.value)}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="email@..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Valor (R$)</label>
                <input
                  type="number"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Responsável</label>
                <select
                  value={responsavelId}
                  onChange={e => setResponsavelId(e.target.value)}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecionar...</option>
                  {membros?.map(m => (
                    <option key={m.id} value={m.id}>
                      {[m.nome, m.sobrenome].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onRejeitar}
              className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
            >
              Rejeitar
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAceitar}
                disabled={aceitar.isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {aceitar.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Aceitar e criar'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
