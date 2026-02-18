

## Correcoes: Menu do usuario em /configuracoes + Escala do /perfil

---

### 1. ConfigHeader sem "Meu Perfil" (Bug visual)

O menu do usuario no header de `/configuracoes` (`ConfigHeader.tsx`) tem apenas "Sair", enquanto o header principal do CRM (`AppLayout.tsx`) tem "Meu Perfil" + "Sair". Falta adicionar o link para `/perfil`.

**Correcao**: Adicionar um `NavLink` para `/perfil` entre o bloco de info do usuario e o botao "Sair", identico ao padrao do `AppLayout.tsx`. Importar `User` do lucide-react e `NavLink` do react-router-dom.

**Arquivo**: `src/modules/configuracoes/components/layout/ConfigHeader.tsx`

Adicionar entre a div de info (linha 92) e o botao Sair (linha 93):

```typescript
<NavLink
  to="/perfil"
  onClick={() => setUserMenuOpen(false)}
  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
>
  <User className="w-4 h-4" />
  Meu Perfil
</NavLink>
```

---

### 2. PerfilPage — Problemas de Escala

#### 2.1 `useState` usado como `useEffect` (Bug)

Linha 54: `useState(() => { loadTelefone() })` e um hack que funciona mas e semanticamente incorreto. `useState` nao deve ser usado para side effects. Isso pode causar comportamento inesperado em strict mode (executa 2x no dev) e nao respeita o ciclo de vida correto.

**Correcao**: Substituir por `useEffect` com dependencia em `user?.id`.

```typescript
import { useState, useRef, useCallback, useEffect } from 'react'

// ...
useEffect(() => { loadTelefone() }, [loadTelefone])
```

#### 2.2 `loadTelefone` sem tratamento de erro

Se a query falhar, o erro e silenciosamente ignorado e `telefoneLoaded` nunca vira `true` (impedindo retry). Tambem nao tem `telefoneLoaded` setado no catch.

**Correcao**: Adicionar try/catch com `setTelefoneLoaded(true)` no finally.

```typescript
const loadTelefone = useCallback(async () => {
  if (telefoneLoaded || !user?.id) return
  try {
    const { data } = await supabase
      .from('usuarios')
      .select('telefone')
      .eq('id', user.id)
      .single()
    if (data?.telefone) setTelefone(formatPhone(data.telefone))
  } catch {
    // silencioso - telefone e opcional
  } finally {
    setTelefoneLoaded(true)
  }
}, [user?.id, telefoneLoaded])
```

#### 2.3 Upload de avatar sem `.limit()` ou validacao de tamanho

O upload aceita qualquer arquivo `image/*` sem validacao de tamanho antes da compressao. Para escala, um usuario pode tentar enviar um arquivo de 50MB que vai travar o browser durante a compressao.

**Correcao**: Adicionar validacao de tamanho maximo (5MB) antes de comprimir:

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
if (file.size > MAX_FILE_SIZE) {
  toast.error('A imagem deve ter no maximo 5MB')
  return
}
```

---

### 3. Resumo

| # | Acao | Arquivo | Impacto |
|---|------|---------|---------|
| 1 | Adicionar "Meu Perfil" no menu | `ConfigHeader.tsx` | Paridade com header CRM |
| 2 | Trocar useState por useEffect | `PerfilPage.tsx` | Corrige side-effect incorreto |
| 3 | Try/catch no loadTelefone | `PerfilPage.tsx` | Resiliencia |
| 4 | Validacao de tamanho no upload | `PerfilPage.tsx` | Previne travamento |

### 4. Garantias

- Nenhuma mudanca visual nos componentes existentes
- Menu do ConfigHeader fica identico ao do AppLayout
- PerfilPage mantem mesma aparencia e funcionalidade
- Nenhuma prop ou hook renomeado

