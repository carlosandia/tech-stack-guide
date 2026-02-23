import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { formatTelefone } from '@/lib/formatters'
import { toast } from 'sonner'

/**
 * AIDEV-NOTE: Formulario de demonstracao nativo React.
 * Renderiza os campos diretamente sem depender de edge functions ou script injection.
 * Submete na tabela submissoes_formularios com o formulario_id correto.
 */

interface DemoFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FORMULARIO_ID = '2fa1f6a1-f4d0-4b8e-8d9a-de9da4034b48'
const ORGANIZACAO_ID = '6716bbd0-9533-4007-80e4-1533aa31789f'

export function DemoFormModal({ open, onOpenChange }: DemoFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    empresa: '',
    tamanho_time: '',
  })

  const handleTelefoneChange = (value: string) => {
    setForm(prev => ({ ...prev, telefone: formatTelefone(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Preencha ao menos nome e email.')
      return
    }

    setLoading(true)
    try {
      const dados = {
        nome_e_sobrenome: form.nome.trim(),
        telefone_br_mlrbc6o7: form.telefone.replace(/\D/g, ''),
        email_mlrbc399: form.email.trim(),
        texto_mlrbhq3a: form.empresa.trim(),
        numero_mlrbi1ys: form.tamanho_time ? Number(form.tamanho_time) : null,
      }

      const { error } = await supabase.from('submissoes_formularios').insert({
        formulario_id: FORMULARIO_ID,
        organizacao_id: ORGANIZACAO_ID,
        dados,
        status: 'novo',
        honeypot_preenchido: false,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        pagina_origem: window.location.href,
      })

      if (error) throw error

      // Incrementar contador de submissões
      await supabase.rpc('incrementar_submissoes_formulario', {
        p_formulario_id: FORMULARIO_ID,
      })

      toast.success('Solicitação enviada com sucesso! Entraremos em contato em breve.')
      setForm({ nome: '', telefone: '', email: '', empresa: '', tamanho_time: '' })
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao enviar formulário:', err)
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Demonstração Gratuita
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha seus dados e nossa equipe entrará em contato para agendar sua demonstração.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="demo-nome">Nome e sobrenome *</Label>
            <Input
              id="demo-nome"
              value={form.nome}
              onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="demo-telefone">Telefone</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 border border-input rounded-md bg-muted text-sm text-muted-foreground shrink-0">
                <span>🇧🇷</span>
                <span>+55</span>
              </div>
              <Input
                id="demo-telefone"
                value={form.telefone}
                onChange={e => handleTelefoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="demo-email">Email *</Label>
            <Input
              id="demo-email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="seu@email.com"
              type="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="demo-empresa">Nome da empresa</Label>
            <Input
              id="demo-empresa"
              value={form.empresa}
              onChange={e => setForm(prev => ({ ...prev, empresa: e.target.value }))}
              placeholder="Sua empresa"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="demo-time">Tamanho do time comercial</Label>
            <Input
              id="demo-time"
              value={form.tamanho_time}
              onChange={e => setForm(prev => ({ ...prev, tamanho_time: e.target.value.replace(/\D/g, '') }))}
              placeholder="Ex: 5"
              type="text"
              inputMode="numeric"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Solicitar demonstração'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
