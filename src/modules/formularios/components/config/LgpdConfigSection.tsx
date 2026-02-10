/**
 * AIDEV-NOTE: Seção LGPD/Consentimento reutilizável para todos os tipos de formulário
 * Salva diretamente na tabela formularios (campos lgpd_*)
 */

import { useState, useEffect } from 'react'
import { Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { formulariosApi, type Formulario } from '../../services/formularios.api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Props {
  formulario: Formulario
}

export function LgpdConfigSection({ formulario }: Props) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    lgpd_ativo: formulario.lgpd_ativo ?? false,
    lgpd_texto_consentimento: formulario.lgpd_texto_consentimento || 'Ao enviar este formulário, você concorda com nossa Política de Privacidade.',
    lgpd_url_politica: formulario.lgpd_url_politica || '',
    lgpd_checkbox_obrigatorio: formulario.lgpd_checkbox_obrigatorio ?? true,
  })

  useEffect(() => {
    setForm({
      lgpd_ativo: formulario.lgpd_ativo ?? false,
      lgpd_texto_consentimento: formulario.lgpd_texto_consentimento || 'Ao enviar este formulário, você concorda com nossa Política de Privacidade.',
      lgpd_url_politica: formulario.lgpd_url_politica || '',
      lgpd_checkbox_obrigatorio: formulario.lgpd_checkbox_obrigatorio ?? true,
    })
  }, [formulario.id])

  const salvar = useMutation({
    mutationFn: () => formulariosApi.atualizar(formulario.id, {
      lgpd_ativo: form.lgpd_ativo,
      lgpd_texto_consentimento: form.lgpd_texto_consentimento || null,
      lgpd_url_politica: form.lgpd_url_politica || null,
      lgpd_checkbox_obrigatorio: form.lgpd_checkbox_obrigatorio,
    } as Partial<Formulario>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formulario.id] })
      toast.success('Configurações LGPD salvas')
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao salvar LGPD'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">LGPD / Consentimento</h4>
      </div>

      <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="lgpd-ativo" className="text-xs cursor-pointer font-medium">Ativar LGPD</Label>
          <Switch
            id="lgpd-ativo"
            checked={form.lgpd_ativo}
            onCheckedChange={(v) => setForm((f) => ({ ...f, lgpd_ativo: v }))}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Quando ativo, exibe automaticamente um checkbox de consentimento antes do botão de envio.
        </p>

        {form.lgpd_ativo && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lgpd-obrigatorio"
                checked={form.lgpd_checkbox_obrigatorio}
                onChange={(e) => setForm((f) => ({ ...f, lgpd_checkbox_obrigatorio: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="lgpd-obrigatorio" className="text-xs cursor-pointer">Checkbox obrigatório</Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Texto de Consentimento</Label>
              <Textarea
                value={form.lgpd_texto_consentimento}
                onChange={(e) => setForm((f) => ({ ...f, lgpd_texto_consentimento: e.target.value }))}
                rows={3}
                placeholder="Ao enviar este formulário..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">URL Política de Privacidade</Label>
              <Input
                value={form.lgpd_url_politica}
                onChange={(e) => setForm((f) => ({ ...f, lgpd_url_politica: e.target.value }))}
                placeholder="https://seusite.com/privacidade"
                className="text-xs"
              />
            </div>
          </>
        )}
      </div>

      <Button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="w-full" size="sm">
        {salvar.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar LGPD'}
      </Button>
    </div>
  )
}
