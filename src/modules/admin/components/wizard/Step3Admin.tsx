import { useFormContext, useWatch } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { CriarOrganizacaoData } from '../../schemas/organizacao.schema'

/**
 * AIDEV-NOTE: Etapa 3 do Wizard - Dados do Administrador
 * Conforme PRD-14 - RF-002
 */

export function Step3Admin() {
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CriarOrganizacaoData>()

  const enviarConvite = useWatch({
    control,
    name: 'enviar_convite',
    defaultValue: true,
  })

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-foreground">
          O administrador tera acesso completo a gestao da organizacao, incluindo configuracoes,
          usuarios e todos os modulos do CRM.
        </p>
      </div>

      {/* Nome e Sobrenome */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nome <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            {...register('admin_nome')}
            placeholder="Joao"
            className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          {errors.admin_nome && (
            <p className="mt-1 text-sm text-destructive">{errors.admin_nome.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Sobrenome <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            {...register('admin_sobrenome')}
            placeholder="Silva"
            className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          {errors.admin_sobrenome && (
            <p className="mt-1 text-sm text-destructive">{errors.admin_sobrenome.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          {...register('admin_email')}
          placeholder="joao@empresa.com.br"
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {errors.admin_email && (
          <p className="mt-1 text-sm text-destructive">{errors.admin_email.message}</p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Telefone
        </label>
        <input
          type="tel"
          {...register('admin_telefone')}
          placeholder="(11) 99999-9999"
          className="w-full h-11 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Checkbox Enviar Convite */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <input
          type="checkbox"
          id="enviar_convite"
          {...register('enviar_convite')}
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
        />
        <div>
          <label htmlFor="enviar_convite" className="text-sm font-medium text-foreground cursor-pointer">
            Enviar convite por email
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            O administrador recebera um email para definir sua senha e ativar a conta.
          </p>
        </div>
      </div>

      {/* Senha Inicial (condicional) */}
      {!enviarConvite && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Senha Inicial <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              {...register('senha_inicial')}
              placeholder="Minimo 8 caracteres"
              className="w-full h-11 px-4 pr-12 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.senha_inicial && (
            <p className="mt-1 text-sm text-destructive">{errors.senha_inicial.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Deve conter no minimo 8 caracteres. O administrador podera alterar depois.
          </p>
        </div>
      )}
    </div>
  )
}
