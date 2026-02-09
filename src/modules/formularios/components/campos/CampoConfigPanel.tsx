/**
 * AIDEV-NOTE: Painel lateral de configuração do campo selecionado
 * Permite editar label, placeholder, obrigatório, validações, mapeamento
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CampoFormulario } from '../../services/formularios.api'

const MAPEAMENTOS = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'nome', label: 'Nome' },
  { value: 'sobrenome', label: 'Sobrenome' },
  { value: 'email', label: 'Email' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'cargo', label: 'Cargo' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'website', label: 'Website' },
  { value: 'observacoes', label: 'Observações' },
]

const LARGURAS = [
  { value: 'full', label: 'Largura Total' },
  { value: 'half', label: 'Meia Largura' },
  { value: 'third', label: 'Um Terço' },
]

interface Props {
  campo: CampoFormulario
  onUpdate: (payload: Partial<CampoFormulario>) => void
  onClose: () => void
  className?: string
}

export function CampoConfigPanel({ campo, onUpdate, onClose, className }: Props) {
  const [form, setForm] = useState({
    label: campo.label || '',
    nome: campo.nome || '',
    placeholder: campo.placeholder || '',
    texto_ajuda: campo.texto_ajuda || '',
    obrigatorio: campo.obrigatorio,
    mapeamento_campo: campo.mapeamento_campo || '',
    largura: campo.largura || 'full',
    valor_padrao: campo.valor_padrao || '',
  })

  // Reset when campo changes
  useEffect(() => {
    setForm({
      label: campo.label || '',
      nome: campo.nome || '',
      placeholder: campo.placeholder || '',
      texto_ajuda: campo.texto_ajuda || '',
      obrigatorio: campo.obrigatorio,
      mapeamento_campo: campo.mapeamento_campo || '',
      largura: campo.largura || 'full',
      valor_padrao: campo.valor_padrao || '',
    })
  }, [campo.id])

  const handleSave = () => {
    onUpdate({
      label: form.label,
      nome: form.nome,
      placeholder: form.placeholder || null,
      texto_ajuda: form.texto_ajuda || null,
      obrigatorio: form.obrigatorio,
      mapeamento_campo: form.mapeamento_campo || null,
      largura: form.largura,
      valor_padrao: form.valor_padrao || null,
    })
  }

  const needsOptions = ['selecao', 'selecao_multipla', 'radio', 'ranking'].includes(campo.tipo)
  const [opcoesText, setOpcoesText] = useState(
    (campo.opcoes as string[] || []).join('\n')
  )

  useEffect(() => {
    setOpcoesText((campo.opcoes as string[] || []).join('\n'))
  }, [campo.id])

  return (
    <div className={cn('space-y-4 overflow-y-auto', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Configurar Campo</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Label</Label>
          <Input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Ex: Nome completo"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Nome interno</Label>
          <Input
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Ex: nome_completo"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={form.placeholder}
            onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
            placeholder="Texto de exemplo"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Texto de Ajuda</Label>
          <Textarea
            value={form.texto_ajuda}
            onChange={(e) => setForm((f) => ({ ...f, texto_ajuda: e.target.value }))}
            placeholder="Instrução para o usuário"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Valor Padrão</Label>
          <Input
            value={form.valor_padrao}
            onChange={(e) => setForm((f) => ({ ...f, valor_padrao: e.target.value }))}
            placeholder="Valor inicial"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="obrigatorio"
            checked={form.obrigatorio}
            onChange={(e) => setForm((f) => ({ ...f, obrigatorio: e.target.checked }))}
            className="rounded border-input"
          />
          <Label htmlFor="obrigatorio" className="text-xs cursor-pointer">Obrigatório</Label>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Largura</Label>
          <Select value={form.largura} onValueChange={(v) => setForm((f) => ({ ...f, largura: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LARGURAS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Mapear para Contato</Label>
          <Select
            value={form.mapeamento_campo || 'nenhum'}
            onValueChange={(v) => setForm((f) => ({ ...f, mapeamento_campo: v === 'nenhum' ? '' : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              {MAPEAMENTOS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsOptions && (
          <div className="space-y-1.5">
            <Label className="text-xs">Opções (uma por linha)</Label>
            <Textarea
              value={opcoesText}
              onChange={(e) => setOpcoesText(e.target.value)}
              rows={4}
              placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
            />
          </div>
        )}
      </div>

      <Button
        onClick={() => {
          if (needsOptions) {
            const opcoes = opcoesText.split('\n').map((o) => o.trim()).filter(Boolean)
            onUpdate({
              ...form,
              placeholder: form.placeholder || null,
              texto_ajuda: form.texto_ajuda || null,
              mapeamento_campo: form.mapeamento_campo || null,
              valor_padrao: form.valor_padrao || null,
              opcoes: opcoes as any,
            } as any)
          } else {
            handleSave()
          }
        }}
        className="w-full"
        size="sm"
      >
        Salvar Alterações
      </Button>
    </div>
  )
}
