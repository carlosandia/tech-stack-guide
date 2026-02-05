

# Plano: Simplificar Menu do Usuário no Header

## Problema Atual

O canto direito do header tem elementos redundantes:

```
┌─────────────────────────────────────────────────────────┐
│ [Super Admin]   [S]  superadmin@renove...  ▾           │
│      ↑          ↑           ↑                          │
│   Badge      Avatar      Email (redundante)            │
└─────────────────────────────────────────────────────────┘
```

## Proposta

Unificar para um formato mais limpo e menos repetitivo:

```
┌─────────────────────────────────────────────────────────┐
│ [S]  Nome do Usuário  ▾                                │
│  ↑         ↑                                            │
│ Avatar   Nome (não email)                              │
└─────────────────────────────────────────────────────────┘
```

O Badge "Super Admin" será movido para dentro do dropdown como informação contextual.

---

## Alterações no AdminLayout.tsx

### Estrutura Atual (Linhas 224-272)

```tsx
{/* Right: Badge + User Menu */}
<div className="flex items-center gap-3">
  {/* Badge Super Admin */}
  <span className="hidden sm:inline-flex...">Super Admin</span>

  {/* User menu */}
  <button>
    <div>Avatar</div>
    <span>{user?.email}</span>  ← Email
    <ChevronDown />
  </button>
</div>
```

### Nova Estrutura Proposta

```tsx
{/* Right: User Menu Unificado */}
<div className="flex items-center">
  <button className="flex items-center gap-2 p-2 hover:bg-gray-100/70 rounded-md">
    {/* Avatar */}
    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
      <span className="text-sm font-medium text-gray-600">
        {user?.nome?.[0]?.toUpperCase() || 'U'}
      </span>
    </div>
    
    {/* Nome + Chevron */}
    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[150px] truncate">
      {user?.nome || 'Usuário'}
    </span>
    <ChevronDown className="w-4 h-4 text-gray-500" />
  </button>

  {/* Dropdown */}
  <div className="dropdown...">
    <div className="px-3 py-2 border-b">
      <p className="text-sm font-medium">{user?.nome}</p>
      <p className="text-xs text-gray-500">{user?.email}</p>
      <span className="badge">Super Admin</span>  ← Badge vai pro dropdown
    </div>
    <button>Sair</button>
  </div>
</div>
```

---

## Detalhes da Mudança

| Elemento | Antes | Depois |
|----------|-------|--------|
| **Badge "Super Admin"** | Separado no header | Dentro do dropdown |
| **Texto do botão** | Email | Nome (`user?.nome`) |
| **Inicial do avatar** | Primeira letra do email | Primeira letra do nome |
| **Dropdown info** | Email + "Super Admin" | Nome + Email + Badge |

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/layouts/AdminLayout.tsx` | Remover badge separado, trocar email por nome no botão e avatar |

---

## Resultado Visual Esperado

### Header (Desktop)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [R] CRM Renove  Dashboard  [Organizações]  Planos  ...    [A] Admin ▾   │
│                                                             ↑           │
│                                                    Avatar + Nome        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Dropdown Aberto
```
┌────────────────────────────┐
│ Admin                      │
│ admin@renove.com           │
│ [Super Admin]              │  ← Badge aqui
├────────────────────────────┤
│ 🚪 Sair                    │
└────────────────────────────┘
```

---

## Checklist de Implementação

- [ ] Remover `<span className="hidden sm:inline-flex...">Super Admin</span>` separado
- [ ] Trocar `user?.email` por `user?.nome` no botão
- [ ] Trocar inicial do avatar de `user?.email?.[0]` para `user?.nome?.[0]`
- [ ] Adicionar badge "Super Admin" dentro do dropdown
- [ ] Manter email como info secundária no dropdown

