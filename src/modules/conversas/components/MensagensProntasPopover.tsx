/**
 * AIDEV-NOTE: Popover de Mensagens Prontas (Quick Replies) com criação inline
 * Acionado por "/" no textarea ou pelo ícone de raio
 */

import { useState, useEffect, useRef } from 'react'
import { X, Search, Zap, Loader2, Plus } from 'lucide-react'
import { useMensagensProntas } from '../hooks/useMensagensProntas'
import { conversasApi } from '../services/conversas.api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface MensagensProntasPopoverProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (conteudo: string) => void
}

export function MensagensProntasPopover({ isOpen, onClose, onSelect }: MensagensProntasPopoverProps) {
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const [novoAtalho, setNovoAtalho] = useState('')
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoConteudo, setNovoConteudo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const { data, isLoading } = useMensagensProntas(busca || undefined)
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const atalhoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setBusca('')
      setCriando(false)
      resetForm()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const resetForm = () => {
    setNovoAtalho('')
    setNovoTitulo('')
    setNovoConteudo('')
  }

  const handleCriar = async () => {
    const atalho = novoAtalho.trim().replace(/\s/g, '')
    const titulo = novoTitulo.trim()
    const conteudo = novoConteudo.trim()

    if (!atalho || !titulo || !conteudo) {
      toast.error('Preencha todos os campos')
      return
    }

    setSalvando(true)
    try {
      await conversasApi.criarPronta({ atalho, titulo, conteudo, tipo: 'pessoal' })
      queryClient.invalidateQueries({ queryKey: ['mensagens-prontas'] })
      toast.success('Mensagem pronta criada')
      setCriando(false)
      resetForm()
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar mensagem pronta')
    } finally {
      setSalvando(false)
    }
  }

  if (!isOpen) return null

  const prontas = data?.mensagens_prontas || []
  const pessoais = prontas.filter((m) => m.tipo === 'pessoal')
  const globais = prontas.filter((m) => m.tipo === 'global')

  return (
    <>
      <div className="fixed inset-0 z-[300]" onClick={onClose} />
      <div className="absolute bottom-full left-0 right-0 mb-1 z-[301] bg-white/95 backdrop-blur-md border border-border rounded-lg shadow-lg max-h-[70vh] sm:max-h-[360px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Mensagens Prontas
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setCriando(!criando)
                if (!criando) setTimeout(() => atalhoRef.current?.focus(), 100)
              }}
              className="p-1 hover:bg-accent rounded text-primary"
              title="Nova mensagem pronta"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-accent rounded">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Formulário de criação inline */}
        {criando && (
          <div className="px-3 py-2.5 border-b border-border/50 bg-muted/20 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  ref={atalhoRef}
                  type="text"
                  value={novoAtalho}
                  onChange={(e) => setNovoAtalho(e.target.value.replace(/\s/g, ''))}
                  placeholder="Atalho (ex: ola)"
                  className="w-full px-2 py-1.5 text-xs bg-background border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Título"
                  className="w-full px-2 py-1.5 text-xs bg-background border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <textarea
              value={novoConteudo}
              onChange={(e) => setNovoConteudo(e.target.value)}
              placeholder="Conteúdo da mensagem..."
              rows={2}
              className="w-full px-2 py-1.5 text-xs bg-background border border-border/50 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setCriando(false); resetForm() }}
                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={salvando || !novoAtalho.trim() || !novoTitulo.trim() || !novoConteudo.trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
              >
                {salvando && <Loader2 className="w-3 h-3 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        {!criando && (
          <div className="px-3 py-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por atalho ou título..."
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
          ) : !prontas.length ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma mensagem pronta encontrada
            </div>
          ) : (
            <>
              {pessoais.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase bg-muted/30">
                    Minhas Mensagens
                  </p>
                  {pessoais.map((mp) => (
                    <button
                      key={mp.id}
                      onClick={() => {
                        onSelect(mp.conteudo)
                        onClose()
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-all duration-200 border-b border-border/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">/{mp.atalho}</span>
                        <span className="text-xs text-foreground font-medium">{mp.titulo}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {mp.conteudo.slice(0, 80)}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {globais.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase bg-muted/30">
                    Mensagens da Equipe
                  </p>
                  {globais.map((mp) => (
                    <button
                      key={mp.id}
                      onClick={() => {
                        onSelect(mp.conteudo)
                        onClose()
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-all duration-200 border-b border-border/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">/{mp.atalho}</span>
                        <span className="text-xs text-foreground font-medium">{mp.titulo}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {mp.conteudo.slice(0, 80)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
