import { useFormContext } from 'react-hook-form'
import {
  NUMERO_USUARIOS,
  VOLUME_LEADS,
  OBJETIVOS,
  COMO_CONHECEU,
  type CriarOrganizacaoData,
} from '../../schemas/organizacao.schema'

/**
 * AIDEV-NOTE: Etapa 2 do Wizard - Expectativas e Qualificacao
 * Conforme PRD-14 - RF-002
 */

export function Step2Expectativas() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CriarOrganizacaoData>()

  return (
    <div className="space-y-4">
      {/* Numero de Usuarios */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Numero de Usuarios <span className="text-destructive">*</span>
        </label>
        <select
          {...register('numero_usuarios')}
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="">Selecione</option>
          {NUMERO_USUARIOS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.numero_usuarios && (
          <p className="mt-1 text-sm text-destructive">{errors.numero_usuarios.message}</p>
        )}
      </div>

      {/* Volume de Leads */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Volume de Leads/Mes <span className="text-destructive">*</span>
        </label>
        <select
          {...register('volume_leads_mes')}
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="">Selecione</option>
          {VOLUME_LEADS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.volume_leads_mes && (
          <p className="mt-1 text-sm text-destructive">{errors.volume_leads_mes.message}</p>
        )}
      </div>

      {/* Principal Objetivo */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Principal Objetivo <span className="text-destructive">*</span>
        </label>
        <select
          {...register('principal_objetivo')}
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="">Selecione</option>
          {OBJETIVOS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.principal_objetivo && (
          <p className="mt-1 text-sm text-destructive">{errors.principal_objetivo.message}</p>
        )}
      </div>

      {/* Como Conheceu */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Como conheceu a plataforma?
        </label>
        <select
          {...register('como_conheceu')}
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        >
          <option value="">Selecione (opcional)</option>
          {COMO_CONHECEU.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Observacoes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Observacoes
        </label>
        <textarea
          {...register('observacoes')}
          rows={4}
          placeholder="Informacoes adicionais sobre o cliente..."
          className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
        />
        {errors.observacoes && (
          <p className="mt-1 text-sm text-destructive">{errors.observacoes.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">Maximo 1000 caracteres</p>
      </div>
    </div>
  )
}
