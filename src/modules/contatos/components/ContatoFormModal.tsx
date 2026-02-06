/**
 * AIDEV-NOTE: Modal de criação/edição de contato
 * Conforme PRD-06 e Design System
 * Renderiza campos dinâmicos buscados de /configuracoes/campos
 * Respeita visibilidade configurada pelo ContatoFormFieldsToggle
 */

import { useEffect, useMemo, forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import { X, User, Building2 } from 'lucide-react'
import { StatusContatoOptions, OrigemContatoOptions, PorteOptions } from '../schemas/contatos.schema'
import type { Contato, TipoContato } from '../services/contatos.api'
import { useCampos } from '@/modules/configuracoes/hooks/useCampos'
import type { CampoCustomizado } from '@/modules/configuracoes/services/configuracoes.api'
import { getFieldVisibility } from './ContatoFormFieldsToggle'
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

interface ContatoFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  tipo: TipoContato
  contato?: Contato | null
  loading?: boolean
  empresas?: Array<{ id: string; nome_fantasia?: string | null; razao_social?: string | null }>
  usuarios?: Array<{ id: string; nome: string; sobrenome?: string | null }>
  isAdmin?: boolean
}

// Map campo tipo to input type
function getInputType(tipoCampo: string): string {
  switch (tipoCampo) {
    case 'email': return 'email'
    case 'telefone': return 'tel'
    case 'url': return 'url'
    case 'numero': case 'decimal': return 'number'
    case 'data': return 'date'
    case 'data_hora': return 'datetime-local'
    default: return 'text'
  }
}

function getPlaceholder(campo: CampoCustomizado): string {
  if (campo.placeholder) return campo.placeholder
  switch (campo.tipo) {
    case 'email': return 'email@exemplo.com'
    case 'telefone': return '(11) 99999-9999'
    case 'url': return 'https://...'
    case 'cpf': return '000.000.000-00'
    case 'cnpj': return '00.000.000/0000-00'
    default: return ''
  }
}

export function ContatoFormModal({
  open,
  onClose,
  onSubmit,
  tipo,
  contato,
  loading,
  empresas = [],
  usuarios = [],
  isAdmin = false,
}: ContatoFormModalProps) {
  const isEditing = !!contato
  const isPessoa = tipo === 'pessoa'

  // Buscar campos do configurações
  const entidade = isPessoa ? 'pessoa' : 'empresa'
  const { data: camposData } = useCampos(entidade as 'pessoa' | 'empresa')
  const todosOsCampos = camposData?.campos || []

  // Campos customizados (non-system active fields)
  const camposCustomizados = todosOsCampos.filter(c => !c.sistema && c.ativo)

  // Visibilidade dos campos
  const fieldVisibility = useMemo(() => getFieldVisibility(tipo), [tipo, open])

  const isVisible = (key: string, obrigatorio: boolean) => {
    if (obrigatorio) return true
    return fieldVisibility[key] !== false
  }

  const form = useForm<Record<string, any>>({
    defaultValues: {},
  })

  // Reset form when opening
  useEffect(() => {
    if (!open) return

    const defaults: Record<string, any> = {
      status: 'novo',
      origem: 'manual',
    }

    if (contato) {
      // Populate from existing contato
      if (isPessoa) {
        defaults.nome = contato.nome || ''
        defaults.sobrenome = contato.sobrenome || ''
        defaults.email = contato.email || ''
        defaults.telefone = contato.telefone || ''
        defaults.cargo = contato.cargo || ''
        defaults.empresa_id = contato.empresa_id || ''
        defaults.linkedin_url = contato.linkedin_url || ''
      } else {
        defaults.razao_social = contato.razao_social || ''
        defaults.nome_fantasia = contato.nome_fantasia || ''
        defaults.cnpj = contato.cnpj || ''
        defaults.email = contato.email || ''
        defaults.telefone = contato.telefone || ''
        defaults.website = contato.website || ''
        defaults.segmento = contato.segmento || ''
        defaults.porte = contato.porte || ''
      }
      defaults.status = contato.status || 'novo'
      defaults.origem = contato.origem || 'manual'
      defaults.owner_id = contato.owner_id || ''
      defaults.observacoes = contato.observacoes || ''

      // Custom fields from contato (if stored)
      camposCustomizados.forEach(c => {
        const key = `custom_${c.slug}`
        defaults[key] = (contato as any)?.[key] || (contato as any)?.campos_customizados?.[c.slug] || ''
      })
    } else {
      // New contato defaults
      if (isPessoa) {
        defaults.nome = ''
        defaults.sobrenome = ''
        defaults.email = ''
        defaults.telefone = ''
        defaults.cargo = ''
        defaults.empresa_id = ''
        defaults.linkedin_url = ''
      } else {
        defaults.razao_social = ''
        defaults.nome_fantasia = ''
        defaults.cnpj = ''
        defaults.email = ''
        defaults.telefone = ''
        defaults.website = ''
        defaults.segmento = ''
        defaults.porte = ''
      }
      defaults.owner_id = ''
      defaults.observacoes = ''

      camposCustomizados.forEach(c => {
        defaults[`custom_${c.slug}`] = c.valor_padrao || ''
      })
    }

    form.reset(defaults)
  }, [contato, open, isPessoa, camposCustomizados.length])

  const handleSubmit = (data: Record<string, any>) => {
    const cleanData: Record<string, unknown> = { ...data, tipo }
    // Clean empty strings to undefined
    for (const key of Object.keys(cleanData)) {
      if (cleanData[key] === '') cleanData[key] = undefined
    }
    onSubmit(cleanData)
  }

  if (!open) return null

  // Build the visible system fields for pessoa
  const renderPessoaFields = () => {
    const fields: JSX.Element[] = []

    // Row 1: Nome + Sobrenome (always visible - required)
    fields.push(
      <div key="nome-row" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Nome *" error={form.formState.errors.nome?.message as string} {...form.register('nome', { required: 'Nome é obrigatório' })} />
        {isVisible('sobrenome', true) && (
          <InputField label="Sobrenome" {...form.register('sobrenome')} />
        )}
      </div>
    )

    // Dynamic rows for optional sistema fields
    const optionalRows: JSX.Element[] = []

    if (isVisible('email', false)) {
      optionalRows.push(<InputField key="email" label="Email" type="email" {...form.register('email')} />)
    }
    if (isVisible('telefone', false)) {
      optionalRows.push(<InputField key="telefone" label="Telefone" {...form.register('telefone')} />)
    }
    if (isVisible('cargo', false)) {
      optionalRows.push(<InputField key="cargo" label="Cargo" {...form.register('cargo')} />)
    }
    if (isVisible('linkedin_url', false)) {
      optionalRows.push(<InputField key="linkedin" label="LinkedIn" {...form.register('linkedin_url')} placeholder="https://linkedin.com/in/..." />)
    }
    if (isVisible('empresa_id', false) && empresas.length > 0) {
      optionalRows.push(
        <SelectField key="empresa" label="Empresa vinculada" {...form.register('empresa_id')}>
          <option value="">Nenhuma</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</option>
          ))}
        </SelectField>
      )
    }

    // Group in pairs
    for (let i = 0; i < optionalRows.length; i += 2) {
      const pair = optionalRows.slice(i, i + 2)
      fields.push(
        <div key={`opt-row-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pair}
        </div>
      )
    }

    return fields
  }

  const renderEmpresaFields = () => {
    const fields: JSX.Element[] = []

    // Row 1: Razão Social (always) + Nome Fantasia
    fields.push(
      <div key="empresa-row-1" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Razão Social *" error={form.formState.errors.razao_social?.message as string} {...form.register('razao_social', { required: 'Razão social é obrigatória' })} />
        {isVisible('nome_fantasia', false) && (
          <InputField label="Nome Fantasia" {...form.register('nome_fantasia')} />
        )}
      </div>
    )

    const optionalRows: JSX.Element[] = []

    if (isVisible('cnpj', false)) {
      optionalRows.push(<InputField key="cnpj" label="CNPJ" {...form.register('cnpj')} placeholder="XX.XXX.XXX/XXXX-XX" />)
    }
    if (isVisible('email', false)) {
      optionalRows.push(<InputField key="email" label="Email" type="email" {...form.register('email')} />)
    }
    if (isVisible('telefone', false)) {
      optionalRows.push(<InputField key="telefone" label="Telefone" {...form.register('telefone')} />)
    }
    if (isVisible('website', false)) {
      optionalRows.push(<InputField key="website" label="Website" {...form.register('website')} placeholder="https://..." />)
    }
    if (isVisible('segmento', false)) {
      optionalRows.push(<InputField key="segmento" label="Segmento de Mercado" {...form.register('segmento')} />)
    }
    if (isVisible('porte', false)) {
      optionalRows.push(
        <SelectField key="porte" label="Porte" {...form.register('porte')}>
          <option value="">Selecione</option>
          {PorteOptions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </SelectField>
      )
    }

    for (let i = 0; i < optionalRows.length; i += 2) {
      const pair = optionalRows.slice(i, i + 2)
      fields.push(
        <div key={`opt-row-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pair}
        </div>
      )
    }

    return fields
  }

  // Render custom fields
  const renderCustomFields = () => {
    const visibleCustom = camposCustomizados.filter(c => isVisible(`custom_${c.slug}`, c.obrigatorio))
    if (visibleCustom.length === 0) return null

    const rows: JSX.Element[] = []
    const fields: JSX.Element[] = visibleCustom.map(campo => {
      const key = `custom_${campo.slug}`
      const label = campo.nome + (campo.obrigatorio ? ' *' : '')

      if (campo.tipo === 'select' && campo.opcoes?.length) {
        return (
          <SelectField key={key} label={label} {...form.register(key)}>
            <option value="">Selecione</option>
            {campo.opcoes.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </SelectField>
        )
      }

      if (campo.tipo === 'multi_select' && campo.opcoes?.length) {
        return (
          <SelectField key={key} label={label} {...form.register(key)}>
            <option value="">Selecione</option>
            {campo.opcoes.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </SelectField>
        )
      }

      if (campo.tipo === 'texto_longo') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
            <textarea
              {...form.register(key)}
              rows={2}
              placeholder={getPlaceholder(campo)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        )
      }

      if (campo.tipo === 'booleano') {
        return (
          <div key={key} className="flex items-center gap-2 py-2">
            <input type="checkbox" {...form.register(key)} className="rounded border-input" />
            <label className="text-sm font-medium text-foreground">{label}</label>
          </div>
        )
      }

      return (
        <InputField
          key={key}
          label={label}
          type={getInputType(campo.tipo)}
          placeholder={getPlaceholder(campo)}
          {...form.register(key)}
        />
      )
    })

    // Group in pairs
    for (let i = 0; i < fields.length; i += 2) {
      const pair = fields.slice(i, i + 2)
      rows.push(
        <div key={`custom-row-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pair}
        </div>
      )
    }

    return (
      <>
        <div className="border-t border-border pt-4 mt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Campos Personalizados</p>
        </div>
        {rows}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isPessoa ? <User className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
            <h3 className="text-lg font-semibold text-foreground">
              {isEditing ? 'Editar' : 'Nova'} {isPessoa ? 'Pessoa' : 'Empresa'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Sistema fields */}
            {isPessoa ? renderPessoaFields() : renderEmpresaFields()}

            {/* Status + Origem (always visible) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Status" {...form.register('status')}>
                {StatusContatoOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </SelectField>
              <SelectField label="Origem" {...form.register('origem')}>
                {OrigemContatoOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectField>
            </div>

            {/* Responsável (Admin only) */}
            {isAdmin && usuarios.length > 0 && (
              <SelectField label="Responsável" {...form.register('owner_id')}>
                <option value="">Sem responsável</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome} {u.sobrenome || ''}</option>
                ))}
              </SelectField>
            )}

            {/* Campos personalizados */}
            {renderCustomFields()}

            {/* Observações */}
            {isVisible('observacoes', false) && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
                <textarea
                  {...form.register('observacoes')}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componentes auxiliares de formulário
const InputField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(
  ({ label, error, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        ref={ref}
        {...props}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
)
InputField.displayName = 'InputField'

const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }>(
  ({ label, children, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <select
        ref={ref}
        {...props}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {children}
      </select>
    </div>
  )
)
SelectField.displayName = 'SelectField'
