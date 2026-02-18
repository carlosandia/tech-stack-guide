/**
 * AIDEV-NOTE: Modal para iniciar nova conversa (WhatsApp/Instagram)
 * PRD-09 RF-005: Suporta número direto OU busca de contato existente
 * Usa Supabase direto via conversas.api.ts
 * Inclui seletor de país com bandeira (padrão Brasil +55)
 */

import { useState, useEffect, forwardRef } from 'react'
import { MessageSquare, Search, User, Loader2, ChevronDown } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { useCriarConversa } from '../hooks/useConversas'
import { conversasApi, type ConversaContato } from '../services/conversas.api'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { detectCountryByPhone } from '@/shared/utils/countries'

interface NovaConversaModalProps {
  isOpen: boolean
  onClose: () => void
  onConversaCriada: (id: string) => void
  telefoneInicial?: string | null
}

const PAISES = [
  { codigo: '+55', bandeira: '🇧🇷', nome: 'Brasil', placeholder: '11999999999' },
  { codigo: '+1', bandeira: '🇺🇸', nome: 'EUA', placeholder: '2025551234' },
  { codigo: '+54', bandeira: '🇦🇷', nome: 'Argentina', placeholder: '1155551234' },
  { codigo: '+351', bandeira: '🇵🇹', nome: 'Portugal', placeholder: '912345678' },
  { codigo: '+595', bandeira: '🇵🇾', nome: 'Paraguai', placeholder: '981123456' },
  { codigo: '+598', bandeira: '🇺🇾', nome: 'Uruguai', placeholder: '91234567' },
  { codigo: '+56', bandeira: '🇨🇱', nome: 'Chile', placeholder: '912345678' },
  { codigo: '+57', bandeira: '🇨🇴', nome: 'Colômbia', placeholder: '3101234567' },
  { codigo: '+52', bandeira: '🇲🇽', nome: 'México', placeholder: '5512345678' },
  { codigo: '+44', bandeira: '🇬🇧', nome: 'Reino Unido', placeholder: '7911123456' },
  { codigo: '+34', bandeira: '🇪🇸', nome: 'Espanha', placeholder: '612345678' },
]

export const NovaConversaModal = forwardRef<HTMLDivElement, NovaConversaModalProps>(function NovaConversaModal({ isOpen, onClose, onConversaCriada, telefoneInicial }, _ref) {
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [canal, setCanal] = useState<'whatsapp' | 'instagram'>('whatsapp')
  const [buscaContato, setBuscaContato] = useState('')
  const [contatoSelecionado, setContatoSelecionado] = useState<ConversaContato | null>(null)
  const [contatosResultado, setContatosResultado] = useState<ConversaContato[]>([])
  const [buscando, setBuscando] = useState(false)
  const [modo, setModo] = useState<'telefone' | 'contato'>('telefone')
  const [paisSelecionado, setPaisSelecionado] = useState(PAISES[0])
  const [paisDropdownOpen, setPaisDropdownOpen] = useState(false)

  const criarConversa = useCriarConversa()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMensagem('')
      setCanal('whatsapp')
      setBuscaContato('')
      setContatoSelecionado(null)
      setContatosResultado([])
      setPaisDropdownOpen(false)

      // AIDEV-NOTE: Se telefoneInicial fornecido (ex: vCard), detectar DDI e preencher
      if (telefoneInicial) {
        const digits = telefoneInicial.replace(/\D/g, '')
        const country = detectCountryByPhone(digits)
        if (country) {
          const ddiDigits = country.ddi.replace(/\D/g, '')
          const matchingPais = PAISES.find(p => p.codigo === country.ddi)
          if (matchingPais) setPaisSelecionado(matchingPais)
          else setPaisSelecionado(PAISES[0])
          setTelefone(digits.startsWith(ddiDigits) ? digits.slice(ddiDigits.length) : digits)
        } else {
          setPaisSelecionado(PAISES[0])
          setTelefone(digits)
        }
        setModo('telefone')
      } else {
        setTelefone('')
        setModo('telefone')
        setPaisSelecionado(PAISES[0])
      }
    }
  }, [isOpen, telefoneInicial])

  // Debounced contact search via Supabase direto
  useEffect(() => {
    if (!buscaContato.trim() || buscaContato.trim().length < 2) {
      setContatosResultado([])
      return
    }

    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const contatos = await conversasApi.buscarContatos(buscaContato.trim())
        setContatosResultado(contatos)
      } catch {
        setContatosResultado([])
      } finally {
        setBuscando(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [buscaContato])

  const handleSelectContato = (contato: ConversaContato) => {
    setContatoSelecionado(contato)
    setBuscaContato('')
    setContatosResultado([])
    if (contato.telefone) {
      setTelefone(contato.telefone)
    }
  }

  const handleSubmit = () => {
    if (!mensagem.trim()) return

    const dados: any = {
      canal,
      mensagem_inicial: mensagem.trim(),
    }

    if (contatoSelecionado) {
      dados.contato_id = contatoSelecionado.id
    } else if (telefone.trim()) {
      // Para WhatsApp, concatenar código do país + número limpo
      if (canal === 'whatsapp') {
        const numeroLimpo = telefone.replace(/\D/g, '')
        dados.telefone = paisSelecionado.codigo + numeroLimpo
      } else {
        dados.telefone = telefone.trim()
      }
    } else {
      return
    }

    criarConversa.mutate(dados, {
      onSuccess: (data) => {
        onConversaCriada(data.id)
        onClose()
      },
    })
  }

  const canSubmit = mensagem.trim() && (contatoSelecionado || telefone.trim())

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
            disabled={!canSubmit || criarConversa.isPending}
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

        {/* Contato selecionado */}
        {contatoSelecionado && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{contatoSelecionado.nome || contatoSelecionado.nome_fantasia}</p>
              {contatoSelecionado.telefone && (
                <p className="text-xs text-muted-foreground">{contatoSelecionado.telefone}</p>
              )}
            </div>
            <button
              onClick={() => {
                setContatoSelecionado(null)
                setTelefone('')
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Alterar
            </button>
          </div>
        )}

        {/* Modo: telefone ou contato */}
        {!contatoSelecionado && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModo('telefone')}
                className={`flex-1 py-2 text-xs font-medium rounded-md border transition-all duration-200 ${
                  modo === 'telefone'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                Por número
              </button>
              <button
                onClick={() => setModo('contato')}
                className={`flex-1 py-2 text-xs font-medium rounded-md border transition-all duration-200 ${
                  modo === 'contato'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                Buscar contato
              </button>
            </div>

            {modo === 'telefone' ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {canal === 'whatsapp' ? 'Telefone (DDD + número)' : 'Usuário do Instagram'}
                </label>
                {canal === 'whatsapp' ? (
                  <div className="flex gap-2">
                    {/* Seletor de país com bandeira */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPaisDropdownOpen(!paisDropdownOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-2 h-[38px] text-sm border border-input rounded-md bg-background hover:bg-accent/50 transition-colors min-w-[90px]"
                      >
                        <span className="text-base leading-none">{paisSelecionado.bandeira}</span>
                        <span className="text-xs text-foreground font-medium">{paisSelecionado.codigo}</span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto" />
                      </button>
                      {paisDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setPaisDropdownOpen(false)} />
                          <div className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-md shadow-lg py-1 z-50 max-h-[200px] overflow-y-auto">
                            {PAISES.map((pais) => (
                              <button
                                key={pais.codigo}
                                onClick={() => {
                                  setPaisSelecionado(pais)
                                  setPaisDropdownOpen(false)
                                }}
                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors ${
                                  paisSelecionado.codigo === pais.codigo ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                                }`}
                              >
                                <span className="text-base">{pais.bandeira}</span>
                                <span className="flex-1 text-left">{pais.nome}</span>
                                <span className="text-xs text-muted-foreground">{pais.codigo}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder={paisSelecionado.placeholder}
                      className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="@usuario"
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                )}
                {canal === 'whatsapp' && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Informe DDD + número (ex: {paisSelecionado.placeholder})
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Buscar contato existente
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={buscaContato}
                    onChange={(e) => setBuscaContato(e.target.value)}
                    placeholder="Buscar por nome, email ou telefone..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>

                {buscando && (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  </div>
                )}
                {!buscando && contatosResultado.length > 0 && (
                  <div className="mt-2 border border-border rounded-md max-h-[180px] overflow-y-auto">
                    {contatosResultado.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectContato(c)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50 transition-all duration-200 border-b border-border/30 last:border-b-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.nome || c.nome_fantasia}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.telefone || c.email || ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!buscando && buscaContato.trim().length >= 2 && contatosResultado.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">Nenhum contato encontrado</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Mensagem inicial *</label>
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
})
NovaConversaModal.displayName = 'NovaConversaModal'
