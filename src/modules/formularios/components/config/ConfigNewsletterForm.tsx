/**
 * AIDEV-NOTE: Formulário de configuração da Newsletter (LGPD)
 * Double opt-in, texto de consentimento, política de privacidade
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConfigNewsletter, useSalvarConfigNewsletter } from '../../hooks/useFormularioConfig'
import type { ConfigNewsletter } from '../../services/formularios.api'

interface Props {
  formularioId: string
}

export function ConfigNewsletterForm({ formularioId }: Props) {
  const { data: config, isLoading } = useConfigNewsletter(formularioId)
  const salvar = useSalvarConfigNewsletter(formularioId)

  const [form, setForm] = useState<Partial<ConfigNewsletter>>({
    double_optin_ativo: true,
    assunto_email_confirmacao: 'Confirme sua inscrição',
    template_email_confirmacao: '',
    nome_lista: '',
    frequencia_envio: '',
    descricao_frequencia_envio: '',
    texto_consentimento: 'Ao se inscrever, você concorda em receber nossos emails e aceita nossa Política de Privacidade.',
    url_politica_privacidade: '',
    mostrar_checkbox_consentimento: true,
    provedor_externo: '',
    id_lista_externa: '',
  })

  useEffect(() => {
    if (config) {
      setForm({
        double_optin_ativo: config.double_optin_ativo,
        assunto_email_confirmacao: config.assunto_email_confirmacao || '',
        template_email_confirmacao: config.template_email_confirmacao || '',
        nome_lista: config.nome_lista || '',
        frequencia_envio: config.frequencia_envio || '',
        descricao_frequencia_envio: config.descricao_frequencia_envio || '',
        texto_consentimento: config.texto_consentimento || '',
        url_politica_privacidade: config.url_politica_privacidade || '',
        mostrar_checkbox_consentimento: config.mostrar_checkbox_consentimento,
        provedor_externo: config.provedor_externo || '',
        id_lista_externa: config.id_lista_externa || '',
      })
    }
  }, [config])

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  }

  const update = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Configuração da Newsletter</h4>

      <div className="space-y-3">
        {/* LGPD / Consentimento */}
        <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
          <p className="text-xs font-medium text-foreground">LGPD / Consentimento</p>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="nl-checkbox-consent" checked={form.mostrar_checkbox_consentimento} onChange={(e) => update('mostrar_checkbox_consentimento', e.target.checked)} className="rounded border-input" />
            <Label htmlFor="nl-checkbox-consent" className="text-xs cursor-pointer">Mostrar checkbox de consentimento</Label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Texto de Consentimento</Label>
            <Textarea
              value={form.texto_consentimento || ''}
              onChange={(e) => update('texto_consentimento', e.target.value)}
              rows={3}
              placeholder="Ao se inscrever..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">URL Política de Privacidade</Label>
            <Input
              value={form.url_politica_privacidade || ''}
              onChange={(e) => update('url_politica_privacidade', e.target.value)}
              placeholder="https://seusite.com/privacidade"
              className="text-xs"
            />
          </div>
        </div>

        {/* Double Opt-in */}
        <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="nl-double-optin" checked={form.double_optin_ativo} onChange={(e) => update('double_optin_ativo', e.target.checked)} className="rounded border-input" />
            <Label htmlFor="nl-double-optin" className="text-xs cursor-pointer font-medium">Double Opt-in ativo</Label>
          </div>

          {form.double_optin_ativo && (
            <div className="space-y-1.5">
              <Label className="text-xs">Assunto do Email de Confirmação</Label>
              <Input
                value={form.assunto_email_confirmacao || ''}
                onChange={(e) => update('assunto_email_confirmacao', e.target.value)}
                placeholder="Confirme sua inscrição"
                className="text-xs"
              />
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="space-y-1.5">
          <Label className="text-xs">Nome da Lista</Label>
          <Input
            value={form.nome_lista || ''}
            onChange={(e) => update('nome_lista', e.target.value)}
            placeholder="Newsletter Principal"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Frequência de Envio</Label>
          <Input
            value={form.frequencia_envio || ''}
            onChange={(e) => update('frequencia_envio', e.target.value)}
            placeholder="Semanal, Quinzenal, Mensal..."
            className="text-xs"
          />
        </div>

        {/* Provedor externo */}
        <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
          <p className="text-xs font-medium text-foreground">Provedor Externo (opcional)</p>

          <div className="space-y-1.5">
            <Label className="text-xs">Provedor</Label>
            <Input
              value={form.provedor_externo || ''}
              onChange={(e) => update('provedor_externo', e.target.value)}
              placeholder="mailchimp, convertkit..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">ID da Lista Externa</Label>
            <Input
              value={form.id_lista_externa || ''}
              onChange={(e) => update('id_lista_externa', e.target.value)}
              placeholder="list_abc123"
              className="text-xs"
            />
          </div>
        </div>
      </div>

      <Button onClick={() => salvar.mutate(form)} disabled={salvar.isPending} className="w-full" size="sm">
        {salvar.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Newsletter'}
      </Button>
    </div>
  )
}
