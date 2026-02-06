/**
 * AIDEV-NOTE: Modal de criação/edição de contato
 * Conforme PRD-06 e Design System - Modal rounded-lg shadow-lg p-6
 * Renderiza campos dinâmicos baseado no tipo (pessoa/empresa)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, User, Building2 } from 'lucide-react'
import { PessoaFormSchema, EmpresaFormSchema, StatusContatoOptions, OrigemContatoOptions, PorteOptions } from '../schemas/contatos.schema'
import type { PessoaFormData, EmpresaFormData } from '../schemas/contatos.schema'
import type { Contato, TipoContato } from '../services/contatos.api'

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
  const schema = isPessoa ? PessoaFormSchema : EmpresaFormSchema

  const form = useForm<PessoaFormData | EmpresaFormData>({
    resolver: zodResolver(schema),
    defaultValues: isPessoa
      ? { nome: '', sobrenome: '', email: '', telefone: '', cargo: '', empresa_id: '', linkedin_url: '', status: 'novo', origem: 'manual', owner_id: '', observacoes: '' }
      : { razao_social: '', nome_fantasia: '', cnpj: '', email: '', telefone: '', website: '', segmento: '', porte: '', status: 'novo', origem: 'manual', owner_id: '', observacoes: '' },
  })

  useEffect(() => {
    if (contato && open) {
      if (isPessoa) {
        form.reset({
          nome: contato.nome || '',
          sobrenome: contato.sobrenome || '',
          email: contato.email || '',
          telefone: contato.telefone || '',
          cargo: contato.cargo || '',
          empresa_id: contato.empresa_id || '',
          linkedin_url: contato.linkedin_url || '',
          status: contato.status || 'novo',
          origem: contato.origem || 'manual',
          owner_id: contato.owner_id || '',
          observacoes: contato.observacoes || '',
        })
      } else {
        form.reset({
          razao_social: contato.razao_social || '',
          nome_fantasia: contato.nome_fantasia || '',
          cnpj: contato.cnpj || '',
          email: contato.email || '',
          telefone: contato.telefone || '',
          website: contato.website || '',
          segmento: contato.segmento || '',
          porte: contato.porte || '',
          status: contato.status || 'novo',
          origem: contato.origem || 'manual',
          owner_id: contato.owner_id || '',
          observacoes: contato.observacoes || '',
        })
      }
    } else if (open) {
      form.reset()
    }
  }, [contato, open, isPessoa, form])

  const handleSubmit = (data: PessoaFormData | EmpresaFormData) => {
    const cleanData: Record<string, unknown> = { ...data, tipo }
    // Clean empty strings to undefined
    for (const key of Object.keys(cleanData)) {
      if (cleanData[key] === '') cleanData[key] = undefined
    }
    onSubmit(cleanData)
  }

  if (!open) return null

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
            {isPessoa ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Nome *" error={(form.formState.errors as any).nome?.message} {...form.register('nome' as any)} />
                  <InputField label="Sobrenome" {...form.register('sobrenome' as any)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Email" type="email" error={(form.formState.errors as any).email?.message} {...form.register('email')} />
                  <InputField label="Telefone" {...form.register('telefone')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Cargo" {...form.register('cargo')} />
                  <InputField label="LinkedIn" {...form.register('linkedin_url')} placeholder="https://linkedin.com/in/..." />
                </div>
                {empresas.length > 0 && (
                  <SelectField label="Empresa vinculada" {...form.register('empresa_id')}>
                    <option value="">Nenhuma</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</option>
                    ))}
                  </SelectField>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Razão Social *" error={(form.formState.errors as any).razao_social?.message} {...form.register('razao_social')} />
                  <InputField label="Nome Fantasia" {...form.register('nome_fantasia')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="CNPJ" {...form.register('cnpj')} placeholder="XX.XXX.XXX/XXXX-XX" />
                  <InputField label="Email" type="email" {...form.register('email')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Telefone" {...form.register('telefone')} />
                  <InputField label="Website" {...form.register('website')} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Segmento de Mercado" {...form.register('segmento')} />
                  <SelectField label="Porte" {...form.register('porte')}>
                    <option value="">Selecione</option>
                    {PorteOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </SelectField>
                </div>
              </>
            )}

            {/* Campos comuns */}
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

            {isAdmin && usuarios.length > 0 && (
              <SelectField label="Responsável" {...form.register('owner_id')}>
                <option value="">Sem responsável</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome} {u.sobrenome || ''}</option>
                ))}
              </SelectField>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
              <textarea
                {...form.register('observacoes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
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
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'

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
