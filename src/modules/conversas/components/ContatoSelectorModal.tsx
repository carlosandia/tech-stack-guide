/**
 * AIDEV-NOTE: Modal de busca e seleção de contato para enviar vCard (PRD-09)
 * Busca contatos do CRM, gera vCard e retorna para envio
 */

import { useState, useCallback } from 'react'
import { Search, X, User, Send } from 'lucide-react'
import { conversasApi, type ConversaContato } from '../services/conversas.api'

interface ContatoSelectorModalProps {
  onSelect: (contato: ConversaContato, vcard: string) => void
  onClose: () => void
}

function gerarVCard(contato: ConversaContato): string {
  const nome = contato.nome || contato.nome_fantasia || 'Contato'
  const parts = nome.split(' ')
  const firstName = parts[0] || ''
  const lastName = parts.slice(1).join(' ') || ''

  // Limpar telefone: remover espaços, traços, parênteses
  const telefoneLimpo = contato.telefone?.replace(/[\s\-\(\)\.]/g, '') || ''
  // Extrair apenas dígitos para o waid
  const waid = telefoneLimpo.replace(/\D/g, '')
  // Garantir que o número tenha + no início
  const telFormatado = telefoneLimpo.startsWith('+') ? telefoneLimpo : `+${telefoneLimpo}`

  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n'
  vcard += `FN:${nome}\n`
  vcard += `N:${lastName};${firstName};;;\n`
  if (waid) vcard += `TEL;type=CELL;waid=${waid}:${telFormatado}\n`
  if (contato.email) vcard += `EMAIL:${contato.email}\n`
  vcard += 'END:VCARD'

  return vcard
}

export function ContatoSelectorModal({ onSelect, onClose }: ContatoSelectorModalProps) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ConversaContato[]>([])
  const [loading, setLoading] = useState(false)
  const [selecionado, setSelecionado] = useState<ConversaContato | null>(null)

  const handleBuscar = useCallback(async (termo: string) => {
    setBusca(termo)
    if (termo.length < 2) {
      setResultados([])
      return
    }
    setLoading(true)
    try {
      const contatos = await conversasApi.buscarContatos(termo)
      setResultados(contatos)
    } catch (err) {
      console.error('[ContatoSelector] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleEnviar = useCallback(() => {
    if (!selecionado) return
    const vcard = gerarVCard(selecionado)
    onSelect(selecionado, vcard)
  }, [selecionado, onSelect])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[400] bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[15%] z-[401] mx-auto max-w-md bg-background rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Enviar Contato</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => handleBuscar(e.target.value)}
              placeholder="Buscar contato por nome, email ou telefone..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {busca.length >= 2 ? 'Nenhum contato encontrado' : 'Digite para buscar contatos'}
            </div>
          ) : (
            resultados.map((contato) => (
              <button
                key={contato.id}
                onClick={() => setSelecionado(contato)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0 ${
                  selecionado?.id === contato.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {contato.nome || contato.nome_fantasia || 'Sem nome'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[contato.telefone, contato.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {selecionado && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <div className="text-xs text-muted-foreground truncate flex-1">
              <span className="font-medium text-foreground">{selecionado.nome || selecionado.nome_fantasia}</span>
              {selecionado.telefone && ` · ${selecionado.telefone}`}
            </div>
            <button
              onClick={handleEnviar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar
            </button>
          </div>
        )}
      </div>
    </>
  )
}
