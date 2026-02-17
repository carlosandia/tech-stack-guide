/**
 * AIDEV-NOTE: Componente de envio inline para tarefas de cadência comercial
 * Resolve destinatário via oportunidade -> contato
 * Envia via waha-proxy (WhatsApp) ou send-email (E-mail)
 * Marca tarefa como concluída após envio bem-sucedido
 */

import { useState, useEffect } from 'react'
import { Send, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface TarefaCadencia {
  id: string
  titulo: string
  tipo: string
  oportunidade_id?: string | null
  contato_id?: string | null
  modo?: string
  assunto_email?: string | null
  corpo_mensagem?: string | null
  organizacao_id?: string
}

interface TarefaEnvioInlineProps {
  tarefa: TarefaCadencia
  onEnviado: () => void
  onCancelar: () => void
}

interface DadosContato {
  email?: string | null
  telefone?: string | null
  nome?: string | null
}

export function TarefaEnvioInline({ tarefa, onEnviado, onCancelar }: TarefaEnvioInlineProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [contato, setContato] = useState<DadosContato | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [assunto, setAssunto] = useState(tarefa.assunto_email || '')
  const [mensagem, setMensagem] = useState(tarefa.corpo_mensagem || '')

  const isEmail = tarefa.tipo === 'email'
  const isWhatsApp = tarefa.tipo === 'whatsapp'

  // Resolver contato
  useEffect(() => {
    const resolver = async () => {
      try {
        let contatoId = tarefa.contato_id

        // Se não tem contato_id direto, buscar via oportunidade
        if (!contatoId && tarefa.oportunidade_id) {
          const { data: op } = await supabase
            .from('oportunidades')
            .select('contato_id')
            .eq('id', tarefa.oportunidade_id)
            .single()
          contatoId = op?.contato_id
        }

        if (!contatoId) {
          setErro('Tarefa sem contato vinculado')
          return
        }

        const { data: ct } = await supabase
          .from('contatos')
          .select('nome, nome_fantasia, email, telefone')
          .eq('id', contatoId)
          .single()

        if (!ct) {
          setErro('Contato não encontrado')
          return
        }

        setContato({
          nome: ct.nome || ct.nome_fantasia || 'Sem nome',
          email: ct.email,
          telefone: ct.telefone,
        })

        // Validar dados necessários
        if (isEmail && !ct.email) {
          setErro('Contato sem e-mail cadastrado')
        } else if (isWhatsApp && !ct.telefone) {
          setErro('Contato sem telefone cadastrado')
        }
      } catch {
        setErro('Erro ao carregar dados do contato')
      } finally {
        setLoading(false)
      }
    }
    resolver()
  }, [tarefa.oportunidade_id, tarefa.contato_id, isEmail, isWhatsApp])

  const handleEnviar = async () => {
    if (!mensagem.trim()) {
      toast.error('Mensagem não pode estar vazia')
      return
    }
    if (isEmail && !assunto.trim()) {
      toast.error('Assunto é obrigatório para e-mail')
      return
    }

    setEnviando(true)
    try {
      if (isWhatsApp && contato?.telefone) {
        // Buscar sessão WAHA ativa
        const { data: sessoes } = await supabase
          .from('sessoes_whatsapp')
          .select('session_name')
          .eq('status', 'connected')
          .limit(1)

        if (!sessoes || sessoes.length === 0) {
          toast.error('WhatsApp não conectado')
          setEnviando(false)
          return
        }

        // Formatar chat_id
        const telefoneNumeros = contato.telefone.replace(/\D/g, '')
        const chatId = `${telefoneNumeros}@c.us`

        const { error } = await supabase.functions.invoke('waha-proxy', {
          body: {
            action: 'enviar_mensagem',
            session_name: sessoes[0].session_name,
            chat_id: chatId,
            text: mensagem,
          },
        })

        if (error) throw error
      } else if (isEmail && contato?.email) {
        const { error } = await supabase.functions.invoke('send-email', {
          body: {
            to: contato.email,
            subject: assunto,
            body: mensagem,
            body_type: 'text',
          },
        })

        if (error) throw error
      }

      // Marcar tarefa como concluída
      await supabase
        .from('tarefas')
        .update({
          status: 'concluida',
          data_conclusao: new Date().toISOString(),
        } as any)
        .eq('id', tarefa.id)

      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      toast.success(`${isEmail ? 'E-mail' : 'WhatsApp'} enviado com sucesso`)
      onEnviado()
    } catch (err) {
      console.error('Erro ao enviar:', err)
      toast.error(`Erro ao enviar ${isEmail ? 'e-mail' : 'WhatsApp'}`)
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3 border-t border-border">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (erro) {
    return (
      <div className="px-3 py-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-warning-foreground">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-xs">{erro}</span>
        </div>
        <button onClick={onCancelar} className="text-[10px] text-muted-foreground hover:text-foreground mt-1">
          Fechar
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 border-t border-border space-y-2">
      {/* Destinatário */}
      <div className="text-[10px] text-muted-foreground">
        Para: <span className="text-foreground font-medium">{isEmail ? contato?.email : contato?.telefone}</span>
        <span className="ml-1">({contato?.nome})</span>
      </div>

      {/* Assunto (email) */}
      {isEmail && (
        <input
          value={assunto}
          onChange={e => setAssunto(e.target.value)}
          className="w-full h-7 px-2 rounded border border-input bg-background text-foreground text-xs focus:ring-1 focus:ring-ring"
          placeholder="Assunto"
        />
      )}

      {/* Mensagem */}
      <textarea
        value={mensagem}
        onChange={e => setMensagem(e.target.value)}
        className="w-full px-2 py-1.5 rounded border border-input bg-background text-foreground text-xs focus:ring-1 focus:ring-ring resize-none"
        rows={3}
        placeholder="Mensagem..."
      />

      {/* Ações */}
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={onCancelar} className="px-2 h-7 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
          Cancelar
        </button>
        <button
          onClick={handleEnviar}
          disabled={enviando || !mensagem.trim() || (isEmail && !assunto.trim())}
          className="flex items-center gap-1 px-2 h-7 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
        >
          {enviando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Enviar
        </button>
      </div>
    </div>
  )
}