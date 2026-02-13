/**
 * AIDEV-NOTE: Página de edição de perfil do usuário
 * Admin e Member podem editar: nome, sobrenome, telefone, senha, foto
 * Email é exibido mas bloqueado (não editável)
 */

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Camera, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { compressImage } from '@/shared/utils/compressMedia'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function PerfilPage() {
  const { user, refreshUser, session } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(user?.nome || '')
  const [sobrenome, setSobrenome] = useState(user?.sobrenome || '')
  const [telefone, setTelefone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Senha
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [savingSenha, setSavingSenha] = useState(false)
  const [telefoneLoaded, setTelefoneLoaded] = useState(false)

  // Carregar telefone do banco na primeira vez
  const loadTelefone = useCallback(async () => {
    if (telefoneLoaded || !user?.id) return
    const { data } = await supabase
      .from('usuarios')
      .select('telefone')
      .eq('id', user.id)
      .single()
    if (data?.telefone) setTelefone(formatPhone(data.telefone))
    setTelefoneLoaded(true)
  }, [user?.id, telefoneLoaded])

  // Carregar dados ao montar
  useState(() => { loadTelefone() })

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value))
  }

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.user?.id) return

    setUploadingPhoto(true)
    try {
      const compressed = await compressImage(file, file.name) as File
      const ext = compressed.name?.split('.').pop() || 'jpg'
      const path = `${session.user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl, foto_storage_path: path })
        .eq('id', user!.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      await refreshUser()
      toast.success('Foto atualizada')
    } catch (err: any) {
      toast.error('Erro ao fazer upload: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSalvarPerfil = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: nome.trim(),
          sobrenome: sobrenome.trim() || null,
          telefone: telefone.replace(/\D/g, '') || null,
        })
        .eq('id', user.id)

      if (error) throw error
      await refreshUser()
      toast.success('Perfil atualizado')
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || 'Erro'))
    } finally {
      setSaving(false)
    }
  }

  const handleAlterarSenha = async () => {
    if (!novaSenha || novaSenha.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres')
      return
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }
    setSavingSenha(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error

      await supabase
        .from('usuarios')
        .update({ senha_alterada_em: new Date().toISOString() })
        .eq('id', user!.id)

      setNovaSenha('')
      setConfirmarSenha('')
      toast.success('Senha alterada com sucesso')
    } catch (err: any) {
      toast.error('Erro ao alterar senha: ' + (err.message || 'Erro'))
    } finally {
      setSavingSenha(false)
    }
  }

  const initials = `${nome?.[0] || ''}${sobrenome?.[0] || ''}`.toUpperCase() || 'U'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">Meu Perfil</h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="relative group flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl sm:text-2xl font-semibold text-muted-foreground">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFoto}
              className="hidden"
            />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-medium text-foreground truncate">{nome} {sobrenome}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Dados pessoais */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Sobrenome</label>
              <input
                type="text"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={handleTelefoneChange}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSalvarPerfil}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>

        {/* Alterar senha */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Alterar Senha</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-foreground mb-1">Nova Senha</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2 pr-10 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-foreground mb-1">Confirmar Senha</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3 py-2 pr-10 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleAlterarSenha}
              disabled={savingSenha || !novaSenha || novaSenha !== confirmarSenha || novaSenha.length < 8}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
            >
              {savingSenha && <Loader2 className="w-4 h-4 animate-spin" />}
              Alterar Senha
            </button>
          </div>
          {novaSenha && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-3">
              <p className={novaSenha.length >= 8 ? 'text-[hsl(var(--success-foreground))]' : 'text-destructive'}>
                {novaSenha.length >= 8 ? '✓' : '✗'} Mín. 8 caracteres
              </p>
              <p className={/[A-Z]/.test(novaSenha) ? 'text-[hsl(var(--success-foreground))]' : 'text-destructive'}>
                {/[A-Z]/.test(novaSenha) ? '✓' : '✗'} Maiúscula
              </p>
              <p className={/[0-9]/.test(novaSenha) ? 'text-[hsl(var(--success-foreground))]' : 'text-destructive'}>
                {/[0-9]/.test(novaSenha) ? '✓' : '✗'} Número
              </p>
              <p className={novaSenha === confirmarSenha && confirmarSenha ? 'text-[hsl(var(--success-foreground))]' : 'text-muted-foreground'}>
                {novaSenha === confirmarSenha && confirmarSenha ? '✓' : '✗'} Coincidem
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerfilPage
