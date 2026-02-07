/**
 * AIDEV-NOTE: Bloco 1 - Campos da Oportunidade + Contato (RF-14.2)
 * Campos editáveis inline com seções Oportunidade e Contato
 */

import { useState, useCallback } from 'react'
import { DollarSign, User, Calendar, Mail, Phone } from 'lucide-react'
import type { Oportunidade } from '../../services/negocios.api'
import { useAtualizarOportunidade, useAtualizarContato } from '../../hooks/useOportunidadeDetalhes'
import { toast } from 'sonner'

interface DetalhesCamposProps {
  oportunidade: Oportunidade
  membros: Array<{ id: string; nome: string; sobrenome?: string | null }>
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

function getContatoNome(op: Oportunidade): string {
  if (!op.contato) return '—'
  if (op.contato.tipo === 'empresa') {
    return op.contato.nome_fantasia || op.contato.razao_social || '—'
  }
  return [op.contato.nome, op.contato.sobrenome].filter(Boolean).join(' ') || '—'
}

export function DetalhesCampos({ oportunidade, membros }: DetalhesCamposProps) {
  const atualizarOp = useAtualizarOportunidade()
  const atualizarContato = useAtualizarContato()

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleSaveOp = useCallback(async (field: string, value: unknown) => {
    try {
      await atualizarOp.mutateAsync({
        id: oportunidade.id,
        payload: { [field]: value || null },
      })
      setEditingField(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }, [oportunidade.id, atualizarOp])

  const handleSaveContato = useCallback(async (field: string, value: unknown) => {
    if (!oportunidade.contato?.id) return
    try {
      await atualizarContato.mutateAsync({
        id: oportunidade.contato.id,
        payload: { [field]: value || null },
      })
      setEditingField(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }, [oportunidade.contato?.id, atualizarContato])

  const handleResponsavelChange = useCallback(async (userId: string) => {
    try {
      await atualizarOp.mutateAsync({
        id: oportunidade.id,
        payload: { usuario_responsavel_id: userId || null },
      })
    } catch {
      toast.error('Erro ao alterar responsável')
    }
  }, [oportunidade.id, atualizarOp])

  return (
    <div className="space-y-4">
      {/* Seção Oportunidade */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Oportunidade
        </h3>
        <div className="space-y-3">
          {/* Valor */}
          <FieldRow
            icon={<DollarSign className="w-3.5 h-3.5" />}
            label="Valor"
            value={formatCurrency(oportunidade.valor)}
            placeholder="R$ 0,00"
            isEditing={editingField === 'valor'}
            onStartEdit={() => {
              setEditingField('valor')
              setEditValue(String(oportunidade.valor || ''))
            }}
            editValue={editValue}
            onEditChange={setEditValue}
            onSave={() => handleSaveOp('valor', editValue ? parseFloat(editValue) : null)}
            onCancel={() => setEditingField(null)}
          />

          {/* Responsável */}
          <div className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground mb-0.5">Responsável</p>
              <select
                className="w-full text-sm bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:ring-0 p-0 pb-0.5 text-foreground transition-colors cursor-pointer"
                value={oportunidade.usuario_responsavel_id || ''}
                onChange={(e) => handleResponsavelChange(e.target.value)}
              >
                <option value="">Sem responsável</option>
                {membros.map(m => (
                  <option key={m.id} value={m.id}>
                    {[m.nome, m.sobrenome].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Previsão */}
          <FieldRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Previsão de fechamento"
            value={oportunidade.previsao_fechamento ? new Date(oportunidade.previsao_fechamento).toLocaleDateString('pt-BR') : ''}
            placeholder="Sem data"
            isEditing={editingField === 'previsao'}
            onStartEdit={() => {
              setEditingField('previsao')
              setEditValue(oportunidade.previsao_fechamento?.slice(0, 10) || '')
            }}
            editValue={editValue}
            onEditChange={setEditValue}
            onSave={() => handleSaveOp('previsao_fechamento', editValue || null)}
            onCancel={() => setEditingField(null)}
            inputType="date"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Seção Contato */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {oportunidade.contato?.tipo === 'empresa' ? 'Empresa' : 'Contato'}
        </h3>
        <div className="space-y-3">
          <FieldRow
            icon={<User className="w-3.5 h-3.5" />}
            label="Nome"
            value={getContatoNome(oportunidade)}
            placeholder="—"
            isEditing={editingField === 'contato_nome'}
            onStartEdit={() => {
              setEditingField('contato_nome')
              setEditValue(oportunidade.contato?.nome || '')
            }}
            editValue={editValue}
            onEditChange={setEditValue}
            onSave={() => handleSaveContato('nome', editValue)}
            onCancel={() => setEditingField(null)}
          />

          <FieldRow
            icon={<Mail className="w-3.5 h-3.5" />}
            label="E-mail"
            value={oportunidade.contato?.email || ''}
            placeholder="—"
            isEditing={editingField === 'contato_email'}
            onStartEdit={() => {
              setEditingField('contato_email')
              setEditValue(oportunidade.contato?.email || '')
            }}
            editValue={editValue}
            onEditChange={setEditValue}
            onSave={() => handleSaveContato('email', editValue)}
            onCancel={() => setEditingField(null)}
            inputType="email"
          />

          <FieldRow
            icon={<Phone className="w-3.5 h-3.5" />}
            label="Telefone"
            value={oportunidade.contato?.telefone || ''}
            placeholder="—"
            isEditing={editingField === 'contato_telefone'}
            onStartEdit={() => {
              setEditingField('contato_telefone')
              setEditValue(oportunidade.contato?.telefone || '')
            }}
            editValue={editValue}
            onEditChange={setEditValue}
            onSave={() => handleSaveContato('telefone', editValue)}
            onCancel={() => setEditingField(null)}
            inputType="tel"
          />
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Sub-componente: Campo editável inline
// =====================================================

interface FieldRowProps {
  icon: React.ReactNode
  label: string
  value: string
  placeholder: string
  isEditing: boolean
  onStartEdit: () => void
  editValue: string
  onEditChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  inputType?: string
}

function FieldRow({
  icon, label, value, placeholder, isEditing,
  onStartEdit, editValue, onEditChange, onSave, onCancel, inputType = 'text',
}: FieldRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-1 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
        {isEditing ? (
          <input
            type={inputType}
            className="w-full text-sm bg-transparent border-0 border-b border-primary focus:ring-0 p-0 pb-0.5 text-foreground"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave()
              if (e.key === 'Escape') onCancel()
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="w-full text-left text-sm text-foreground border-0 border-b border-transparent hover:border-border p-0 pb-0.5 transition-colors truncate"
          >
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </button>
        )}
      </div>
    </div>
  )
}
