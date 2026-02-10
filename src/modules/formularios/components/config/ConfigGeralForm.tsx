/**
 * AIDEV-NOTE: Configurações gerais do formulário (nome, descrição, status)
 * Exibido na aba "Geral" do EditorTabsConfig para todos os tipos
 */


import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAtualizarFormulario } from '../../hooks/useFormularios'
import { StatusFormularioOptions } from '../../schemas/formulario.schema'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

export function ConfigGeralForm({ formulario }: Props) {
  const atualizar = useAtualizarFormulario()

  const handleUpdate = (field: string, value: string) => {
    atualizar.mutate({ id: formulario.id, payload: { [field]: value } as any })
  }

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
      <h4 className="text-sm font-semibold text-foreground">Informações Gerais</h4>

      <div className="space-y-1.5">
        <Label className="text-xs">Nome do Formulário</Label>
        <Input
          defaultValue={formulario.nome}
          onBlur={(e) => handleUpdate('nome', e.target.value)}
          className="text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Descrição</Label>
        <Textarea
          defaultValue={formulario.descricao || ''}
          onBlur={(e) => handleUpdate('descricao', e.target.value)}
          rows={3}
          className="text-xs"
          placeholder="Descreva o objetivo deste formulário..."
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select
          defaultValue={formulario.status}
          onValueChange={(v) => handleUpdate('status', v)}
        >
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {StatusFormularioOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
