/**
 * AIDEV-NOTE: Modal para criar tarefa a partir de uma conversa
 * Permite agendar lembrete (notificação) para o usuário
 * Vincula a tarefa ao contato da conversa
 */

import { useState } from 'react'
import { ListTodo, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import { toast } from 'sonner'
import { format, addDays, addHours } from 'date-fns'

interface CriarTarefaConversaModalProps {
  contatoId: string
  contatoNome: string
  canal: 'whatsapp' | 'instagram'
  onClose: () => void
}

const TIPOS = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'visita', label: 'Visita' },
  { value: 'outro', label: 'Outro' },
] as const

const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
] as const

const LEMBRETES = [
  { value: '', label: 'Sem lembrete' },
  { value: '1h', label: 'Em 1 hora' },
  { value: '3h', label: 'Em 3 horas' },
  { value: '1d', label: 'Em 1 dia' },
  { value: '2d', label: 'Em 2 dias' },
  { value: '1w', label: 'Em 1 semana' },
  { value: 'custom', label: 'Data personalizada' },
] as const

function calcularLembreteEm(valor: string): string | null {
  if (!valor || valor === 'custom') return null
  const now = new Date()
  switch (valor) {
    case '1h': return addHours(now, 1).toISOString()
    case '3h': return addHours(now, 3).toISOString()
    case '1d': return addDays(now, 1).toISOString()
    case '2d': return addDays(now, 2).toISOString()
    case '1w': return addDays(now, 7).toISOString()
    default: return null
  }
}

export function CriarTarefaConversaModal({
  contatoId,
  contatoNome,
  canal,
  onClose,
}: CriarTarefaConversaModalProps) {
  const queryClient = useQueryClient()

  const [titulo, setTitulo] = useState(`Retornar contato - ${contatoNome}`)
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<string>(canal === 'whatsapp' ? 'whatsapp' : 'outro')
  const [prioridade, setPrioridade] = useState<string>('media')
  const [dataVencimento, setDataVencimento] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"))
  const [lembreteOpcao, setLembreteOpcao] = useState('1d')
  const [lembreteCustom, setLembreteCustom] = useState('')

  const criarTarefa = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: usr } = await supabase
        .from('usuarios')
        .select('id, organizacao_id')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (!usr) throw new Error('Usuário não encontrado')

      // Calcular lembrete
      let lembreteEm: string | null = null
      if (lembreteOpcao === 'custom' && lembreteCustom) {
        lembreteEm = new Date(lembreteCustom).toISOString()
      } else {
        lembreteEm = calcularLembreteEm(lembreteOpcao)
      }

      const { data, error } = await supabase
        .from('tarefas')
        .insert({
          organizacao_id: usr.organizacao_id,
          contato_id: contatoId,
          titulo,
          descricao: descricao || null,
          tipo,
          canal,
          owner_id: usr.id,
          criado_por_id: usr.id,
          data_vencimento: dataVencimento ? new Date(dataVencimento).toISOString() : null,
          lembrete_em: lembreteEm,
          lembrete_enviado: false,
          status: 'pendente',
          prioridade,
        } as any)
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] })
      toast.success('Tarefa criada com sucesso!')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar tarefa')
    },
  })

  const isValid = titulo.trim().length > 0

  return (
    <ModalBase
      onClose={onClose}
      title="Nova Tarefa"
      description={`Criar tarefa para ${contatoNome}`}
      icon={ListTodo}
      variant="create"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={criarTarefa.isPending}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-accent transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => criarTarefa.mutate()}
            disabled={!isValid || criarTarefa.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
          >
            {criarTarefa.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ListTodo className="w-4 h-4" />
            )}
            Criar Tarefa
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Título */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
          />
        </div>

        {/* Tipo + Prioridade */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Prioridade</label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data de Vencimento */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Data de Vencimento</label>
          <input
            type="datetime-local"
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {/* Lembrete */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Lembrete / Notificação</label>
          <select
            value={lembreteOpcao}
            onChange={(e) => setLembreteOpcao(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {LEMBRETES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          {lembreteOpcao === 'custom' && (
            <input
              type="datetime-local"
              value={lembreteCustom}
              onChange={(e) => setLembreteCustom(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 mt-1.5"
            />
          )}
          <p className="text-[11px] text-muted-foreground">
            Você receberá uma notificação quando o lembrete vencer.
          </p>
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Notas sobre a tarefa..."
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground resize-none"
          />
        </div>
      </div>
    </ModalBase>
  )
}