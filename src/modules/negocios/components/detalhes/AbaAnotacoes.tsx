/**
 * AIDEV-NOTE: Aba Anotações (RF-14.3 Tab 1)
 * Suporte a texto, áudio e texto+áudio
 */

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useAnotacoes,
  useCriarAnotacao,
  useCriarAnotacaoAudio,
  useAtualizarAnotacao,
  useExcluirAnotacao,
} from '../../hooks/useOportunidadeDetalhes'
import { AudioRecorder, AudioPlayer } from './AudioRecorder'
import { toast } from 'sonner'

interface AbaAnotacoesProps {
  oportunidadeId: string
  usuarioAtualId?: string
}

export function AbaAnotacoes({ oportunidadeId, usuarioAtualId }: AbaAnotacoesProps) {
  const { data: anotacoes, isLoading } = useAnotacoes(oportunidadeId)
  const criarAnotacao = useCriarAnotacao()
  const criarAnotacaoAudio = useCriarAnotacaoAudio()
  const atualizarAnotacao = useAtualizarAnotacao()
  const excluirAnotacao = useExcluirAnotacao()

  const [novaAnotacao, setNovaAnotacao] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)

  const handleRecordingComplete = useCallback((blob: Blob, durationSeconds: number) => {
    setAudioBlob(blob)
    setAudioDuration(durationSeconds)
    setShowInput(true) // Garantir que o input está visível
  }, [])

  const handleRemoveAudio = useCallback(() => {
    setAudioBlob(null)
    setAudioDuration(0)
  }, [])

  const handleCriar = useCallback(async () => {
    const hasText = novaAnotacao.trim().length > 0
    const hasAudio = !!audioBlob

    if (!hasText && !hasAudio) return

    try {
      if (hasAudio) {
        await criarAnotacaoAudio.mutateAsync({
          oportunidadeId,
          audioBlob,
          duracaoSegundos: audioDuration,
          conteudo: hasText ? novaAnotacao.trim() : undefined,
        })
      } else {
        await criarAnotacao.mutateAsync({
          oportunidadeId,
          conteudo: novaAnotacao.trim(),
        })
      }
      setNovaAnotacao('')
      setAudioBlob(null)
      setAudioDuration(0)
      setShowInput(false)
      toast.success('Anotação adicionada')
    } catch {
      toast.error('Erro ao criar anotação')
    }
  }, [novaAnotacao, audioBlob, audioDuration, oportunidadeId, criarAnotacao, criarAnotacaoAudio])

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

  const isPending = criarAnotacao.isPending || criarAnotacaoAudio.isPending
  const hasContent = novaAnotacao.trim().length > 0 || !!audioBlob

  return (
    <div className="space-y-4">
      {/* Botão Nova Anotação */}
      {!showInput ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Anotação
          </button>
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
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

          {/* Áudio gravado (preview) */}
          {audioBlob && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <AudioPlayer
                  src={URL.createObjectURL(audioBlob)}
                  duration={audioDuration}
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveAudio}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Remover áudio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              disabled={!!audioBlob}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowInput(false); setNovaAnotacao(''); handleRemoveAudio() }}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCriar}
                disabled={!hasContent || isPending}
                className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md
                  hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  flex items-center gap-1.5"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Salvar
              </button>
            </div>
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
            <AnotacaoItem
              key={anotacao.id}
              anotacao={anotacao}
              isOwner={anotacao.usuario_id === usuarioAtualId}
              editingId={editingId}
              editingContent={editingContent}
              onStartEdit={(id, content) => { setEditingId(id); setEditingContent(content || '') }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={handleAtualizar}
              onDelete={handleExcluir}
              onEditContentChange={setEditingContent}
              isUpdating={atualizarAnotacao.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// =====================================================
// Item de Anotação (extraído para manter AbaAnotacoes enxuto)
// =====================================================

interface AnotacaoItemProps {
  anotacao: {
    id: string
    tipo: string
    conteudo: string | null
    audio_url: string | null
    audio_duracao_segundos: number | null
    criado_em: string
    usuario_id: string
    usuario?: { id: string; nome: string } | null
  }
  isOwner: boolean
  editingId: string | null
  editingContent: string
  onStartEdit: (id: string, content: string | null) => void
  onCancelEdit: () => void
  onSaveEdit: (id: string) => void
  onDelete: (id: string) => void
  onEditContentChange: (val: string) => void
  isUpdating: boolean
}

function AnotacaoItem({
  anotacao, isOwner, editingId, editingContent,
  onStartEdit, onCancelEdit, onSaveEdit, onDelete, onEditContentChange, isUpdating,
}: AnotacaoItemProps) {
  const isEditing = editingId === anotacao.id
  const hasText = anotacao.conteudo && anotacao.conteudo.trim().length > 0
  const hasAudio = anotacao.audio_url

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            className="w-full text-sm border border-input rounded-md p-2 min-h-[60px] resize-y
              bg-background text-foreground focus:ring-2 focus:ring-ring"
            value={editingContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSaveEdit(anotacao.id)}
              disabled={isUpdating}
              className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Texto */}
          {hasText && (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {anotacao.conteudo}
            </p>
          )}

          {/* Áudio */}
          {hasAudio && (
            <AudioPlayer
              src={anotacao.audio_url!}
              duration={anotacao.audio_duracao_segundos}
            />
          )}

          {/* Footer */}
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
            {isOwner && (
              <div className="flex items-center gap-1">
                {hasText && (
                  <button
                    type="button"
                    onClick={() => onStartEdit(anotacao.id, anotacao.conteudo)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(anotacao.id)}
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
  )
}
