/**
 * AIDEV-NOTE: Aba Anotações (RF-14.3 Tab 1)
 * Rich text input + listagem de anotações com edição/exclusão
 */

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAnotacoes, useCriarAnotacao, useAtualizarAnotacao, useExcluirAnotacao } from '../../hooks/useOportunidadeDetalhes'
import { toast } from 'sonner'

interface AbaAnotacoesProps {
  oportunidadeId: string
  usuarioAtualId?: string
}

export function AbaAnotacoes({ oportunidadeId, usuarioAtualId }: AbaAnotacoesProps) {
  const { data: anotacoes, isLoading } = useAnotacoes(oportunidadeId)
  const criarAnotacao = useCriarAnotacao()
  const atualizarAnotacao = useAtualizarAnotacao()
  const excluirAnotacao = useExcluirAnotacao()

  const [novaAnotacao, setNovaAnotacao] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const handleCriar = useCallback(async () => {
    if (!novaAnotacao.trim()) return
    try {
      await criarAnotacao.mutateAsync({
        oportunidadeId,
        conteudo: novaAnotacao.trim(),
      })
      setNovaAnotacao('')
      setShowInput(false)
      toast.success('Anotação adicionada')
    } catch {
      toast.error('Erro ao criar anotação')
    }
  }, [novaAnotacao, oportunidadeId, criarAnotacao])

  const handleAtualizar = useCallback(async (anotacaoId: string) => {
    if (!editingContent.trim()) return
    try {
      await atualizarAnotacao.mutateAsync({
        anotacaoId,
        conteudo: editingContent.trim(),
      })
      setEditingId(null)
      toast.success('Anotação atualizada')
    } catch {
      toast.error('Erro ao atualizar')
    }
  }, [editingContent, atualizarAnotacao])

  const handleExcluir = useCallback(async (anotacaoId: string) => {
    try {
      await excluirAnotacao.mutateAsync(anotacaoId)
      toast.success('Anotação excluída')
    } catch {
      toast.error('Erro ao excluir')
    }
  }, [excluirAnotacao])

  return (
    <div className="space-y-4">
      {/* Botão Nova Anotação */}
      {!showInput ? (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Anotação
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full text-sm border border-input rounded-md p-3 min-h-[80px] resize-y
              focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="Escreva uma anotação..."
            value={novaAnotacao}
            onChange={(e) => setNovaAnotacao(e.target.value)}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowInput(false); setNovaAnotacao('') }}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCriar}
              disabled={!novaAnotacao.trim() || criarAnotacao.isPending}
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md
                hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center gap-1.5"
            >
              {criarAnotacao.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Lista de anotações */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !anotacoes?.length ? (
        <div className="text-center py-8">
          <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma anotação ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anotacoes.map(anotacao => (
            <div
              key={anotacao.id}
              className="bg-muted/30 border border-border rounded-lg p-3 space-y-2"
            >
              {editingId === anotacao.id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full text-sm border border-input rounded-md p-2 min-h-[60px] resize-y
                      bg-background text-foreground focus:ring-2 focus:ring-ring"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAtualizar(anotacao.id)}
                      disabled={atualizarAnotacao.isPending}
                      className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {anotacao.conteudo}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium">{anotacao.usuario?.nome || 'Usuário'}</span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(anotacao.criado_em), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {(anotacao.usuario_id === usuarioAtualId) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(anotacao.id)
                            setEditingContent(anotacao.conteudo || '')
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluir(anotacao.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
