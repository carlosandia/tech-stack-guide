/**
 * AIDEV-NOTE: Formulário inline de criação rápida de contato dentro do modal Nova Oportunidade.
 * Usa campos dinâmicos da configuração global (/configuracoes/campos), PhoneInputField com bandeira
 * e toggle de visibilidade (ícone de olho).
 */

import { useState, useMemo, useCallback } from 'react'
import { useCamposConfig } from '@/modules/contatos/hooks/useCamposConfig'
import { PhoneInputField } from '@/modules/contatos/components/PhoneInputField'
import { ContatoFormFieldsToggle, getFieldVisibility } from '@/modules/contatos/components/ContatoFormFieldsToggle'
import { formatCnpj } from '@/lib/formatters'
import { PorteOptions } from '@/modules/contatos/schemas/contatos.schema'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ChevronDown, Check } from 'lucide-react'
import type { TipoContato } from '@/modules/contatos/services/contatos.api'

// =====================================================
// Ordem fixa dos campos do sistema por tipo
// =====================================================

const PESSOA_FIELD_ORDER = ['nome', 'sobrenome', 'email', 'telefone', 'cargo', 'linkedin_url']
const EMPRESA_FIELD_ORDER = ['nome_fantasia', 'razao_social', 'cnpj', 'email', 'telefone', 'website', 'segmento', 'porte']

// Campos que são sempre visíveis (campo principal da entidade)
const ALWAYS_VISIBLE: Record<string, string> = {
  pessoa: 'nome',
  empresa: 'nome_fantasia',
}

// =====================================================
// Types
// =====================================================

export interface ContatoInlineData {
  tipo: TipoContato
  fields: Record<string, string>
}

interface ContatoInlineFormProps {
  tipo: TipoContato
  fields: Record<string, string>
  onChange: (fields: Record<string, string>) => void
  onCancel: () => void
}

// =====================================================
// Component
// =====================================================

export function ContatoInlineForm({ tipo, fields, onChange, onCancel }: ContatoInlineFormProps) {
  const [visibilityVersion, setVisibilityVersion] = useState(0)

  // Config global de campos
  const { getLabel, getPlaceholder, isRequired, sistemaFields, customFields } = useCamposConfig(tipo)

  // Mapa de visibilidade (localStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fieldVisibility = useMemo(() => getFieldVisibility(tipo), [tipo, visibilityVersion])

  const isVisible = useCallback((key: string, obrigatorio: boolean): boolean => {
    // Campo principal sempre visível
    if (key === ALWAYS_VISIBLE[tipo]) return true
    if (obrigatorio) return true
    return fieldVisibility[key] !== false
  }, [fieldVisibility, tipo])

  const updateField = useCallback((key: string, value: string) => {
    onChange({ ...fields, [key]: value })
  }, [fields, onChange])

  // Determinar campos do sistema na ordem correta
  const orderedSystemFields = useMemo(() => {
    const order = tipo === 'pessoa' ? PESSOA_FIELD_ORDER : EMPRESA_FIELD_ORDER
    return order.filter(key => {
      // Verificar se o campo está ativo na config global
      const cfg = sistemaFields.find(f => f.key === key)
      if (cfg) return true
      // Fallback: campos padrão existem mesmo sem config carregada
      return true
    })
  }, [tipo, sistemaFields])

  // Campos customizados visíveis
  const visibleCustomFields = useMemo(() => {
    return customFields.filter(c => c.campo.ativo && isVisible(`custom_${c.slug}`, c.obrigatorio))
  }, [customFields, isVisible])

  // =====================================================
  // Renderização de cada tipo de campo
  // =====================================================

  const renderField = (key: string) => {
    const label = getLabel(key)
    const required = isRequired(key)
    const placeholder = getPlaceholder(key)
    const value = fields[key] || ''

    // Campo de telefone → PhoneInputField
    if (key === 'telefone') {
      return (
        <PhoneInputField
          key={key}
          label={`${label}${required ? ' *' : ''}`}
          value={value}
          onChange={(v) => updateField(key, v)}
        />
      )
    }

    // Campo CNPJ → máscara
    if (key === 'cnpj') {
      return (
        <div key={key}>
          <label className="block text-xs font-medium text-foreground mb-1">
            {label}{required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => updateField(key, formatCnpj(e.target.value))}
            placeholder={placeholder || 'XX.XXX.XXX/XXXX-XX'}
            className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
          />
        </div>
      )
    }

    // Campo porte → select
    if (key === 'porte') {
      return (
        <div key={key}>
          <label className="block text-xs font-medium text-foreground mb-1">
            {label}{required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 appearance-none"
          >
            <option value="">Selecione</option>
            {PorteOptions.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      )
    }

    // Campo padrão (text, email, url)
    const inputType = key === 'email' ? 'email' : key === 'website' || key === 'linkedin_url' ? 'url' : 'text'

    return (
      <div key={key}>
        <label className="block text-xs font-medium text-foreground mb-1">
          {label}{required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        <input
          type={inputType}
          value={value}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={placeholder || ''}
          className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
        />
      </div>
    )
  }

  const renderCustomField = (campo: typeof customFields[0]) => {
    const key = `custom_${campo.slug}`
    const value = fields[key] || ''
    const label = campo.label
    const required = campo.obrigatorio

    if (campo.tipo === 'select' && campo.opcoes.length > 0) {
      return (
        <div key={key}>
          <label className="block text-xs font-medium text-foreground mb-1">
            {label}{required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 appearance-none"
          >
            <option value="">Selecione</option>
            {campo.opcoes.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    }

    if (campo.tipo === 'multi_select' && campo.opcoes.length > 0) {
      const selectedValues = value ? value.split('|').map((s: string) => s.trim()).filter(Boolean) : []
      const toggleOption = (opt: string) => {
        const newSelected = selectedValues.includes(opt)
          ? selectedValues.filter((v: string) => v !== opt)
          : [...selectedValues, opt]
        updateField(key, newSelected.join(' | '))
      }
      return (
        <div key={key}>
          <label className="block text-xs font-medium text-foreground mb-1">
            {label}{required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md flex items-center justify-between gap-2 hover:border-ring/50 transition-colors text-left"
              >
                <span className={`truncate ${selectedValues.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {selectedValues.length === 0
                    ? 'Selecione'
                    : selectedValues.length === 1
                      ? selectedValues[0]
                      : `${selectedValues.length} selecionados`}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
              <div className="max-h-48 overflow-y-auto">
                {campo.opcoes.map(opt => {
                  const isActive = selectedValues.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(opt)}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-2 py-1.5 transition-colors w-full text-left"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive ? 'bg-primary border-primary' : 'border-input'
                      }`}>
                        {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className="text-foreground">{opt}</span>
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )
    }

    if (campo.tipo === 'booleano') {
      return (
        <div key={key} className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => updateField(key, e.target.checked ? 'true' : '')}
            className="rounded border-input"
          />
          <label className="text-xs font-medium text-foreground">{label}</label>
        </div>
      )
    }

    if (campo.tipo === 'telefone') {
      return (
        <PhoneInputField
          key={key}
          label={`${label}${required ? ' *' : ''}`}
          value={value}
          onChange={(v) => updateField(key, v)}
        />
      )
    }

    const inputType = campo.tipo === 'email' ? 'email'
      : campo.tipo === 'url' ? 'url'
      : campo.tipo === 'numero' || campo.tipo === 'decimal' ? 'number'
      : campo.tipo === 'data' ? 'date'
      : 'text'

    return (
      <div key={key}>
        <label className="block text-xs font-medium text-foreground mb-1">
          {label}{required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        <input
          type={inputType}
          value={value}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={campo.placeholder || ''}
          className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
        />
      </div>
    )
  }

  // =====================================================
  // Campos visíveis do sistema (exceto o principal que é sempre visível)
  // =====================================================

  const visibleSystemFields = orderedSystemFields.filter(key => {
    const req = isRequired(key)
    return isVisible(key, req)
  })

  // Agrupar em pares para grid 2 colunas
  const allFieldElements: JSX.Element[] = []

  for (const key of visibleSystemFields) {
    allFieldElements.push(renderField(key))
  }

  for (const campo of visibleCustomFields) {
    allFieldElements.push(renderCustomField(campo))
  }

  // Agrupar em pares
  const fieldRows: JSX.Element[][] = []
  for (let i = 0; i < allFieldElements.length; i += 2) {
    fieldRows.push(allFieldElements.slice(i, i + 2))
  }

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {tipo === 'pessoa' ? 'Nova Pessoa' : 'Nova Empresa'}
        </span>
        <div className="flex items-center gap-2">
          <ContatoFormFieldsToggle
            tipo={tipo}
            onChange={() => setVisibilityVersion(v => v + 1)}
          />
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-primary hover:underline"
          >
            Buscar existente
          </button>
        </div>
      </div>

      {fieldRows.map((pair, i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          {pair}
        </div>
      ))}
    </div>
  )
}

// =====================================================
// Helpers para validação no componente pai
// =====================================================

/**
 * Valida se os campos obrigatórios do formulário inline estão preenchidos.
 * Usa a config global para determinar obrigatoriedade.
 */
export function validarContatoInline(
  tipo: TipoContato,
  fields: Record<string, string>,
  isRequiredFn: (key: string) => boolean,
): boolean {
  // Campo principal é sempre obrigatório
  if (tipo === 'pessoa') {
    if (!fields.nome?.trim() || fields.nome.trim().length < 2) return false
  } else {
    // Para empresa, nome_fantasia é o campo principal no modal
    if (!fields.nome_fantasia?.trim() || fields.nome_fantasia.trim().length < 2) return false
  }

  // Verificar campos marcados como obrigatórios na config global
  const systemKeys = tipo === 'pessoa'
    ? PESSOA_FIELD_ORDER
    : EMPRESA_FIELD_ORDER

  for (const key of systemKeys) {
    if (key === 'nome' || key === 'nome_fantasia') continue // já validou acima
    if (isRequiredFn(key) && !fields[key]?.trim()) return false
  }

  return true
}
