

# Plano: Login Split-Screen com Banner Configuravel

## Resumo

Redesenhar a pagina de login no estilo Pipefy (formulario a esquerda, banner a direita) com imagens configuráveis pelo Super Admin para Desktop, Tablet e Mobile.

---

## 1. Banco de Dados

Inserir nova entrada na tabela `configuracoes_globais` existente:

```text
plataforma: 'login_banner'
configuracoes: {
  "desktop_image_url": "",
  "tablet_image_url": "",
  "mobile_image_url": "",
  "link_url": "",
  "background_color": "#F8FAFC"
}
```

Adicionar policy RLS para permitir leitura anonima (SELECT) desta plataforma especifica, para que a tela de login (sem auth) consiga buscar o banner.

---

## 2. Storage

Criar bucket publico `login-banner` para armazenar as imagens enviadas pelo Super Admin.

---

## 3. Pagina de Configuracoes Globais (Super Admin)

Adicionar nova aba **"Login Banner"** na pagina `ConfiguracoesGlobaisPage.tsx`:

- 3 campos de upload com preview: Desktop (960x1080px), Tablet (768x1024px), Mobile (390x300px)
- Campo de cor de fundo fallback (hex)
- Campo opcional de link (URL de redirecionamento ao clicar no banner)
- Botao "Salvar"

Arquivos afetados:
- `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx` - adicionar tab "Login Banner" e componente de upload
- `src/modules/admin/services/admin.api.ts` - nenhuma mudanca (ja suporta qualquer plataforma)

---

## 4. Tela de Login - Redesign

### Layout Desktop (>= 1024px)

```text
+----------------------------+----------------------------+
|                            |                            |
|     [Logo Renove]          |                            |
|                            |       [Banner Desktop]     |
|  Bem-vindo ao Renove       |       (object-cover)       |
|                            |                            |
|  [Email]                   |                            |
|  [Senha]                   |                            |
|  [x] Lembrar 30 dias       |                            |
|  [    Entrar    ]          |                            |
|  Esqueci minha senha       |                            |
|                            |                            |
+----------------------------+----------------------------+
```

- Esquerda (50%): fundo branco, formulario centralizado
- Direita (50%): banner com `object-cover`, cor de fundo fallback

### Layout Tablet (768px - 1023px)

- Mesmo split 50/50 usando imagem de tablet
- Se nao houver imagem tablet, usa desktop como fallback

### Layout Mobile (< 768px)

- Coluna unica
- Banner mobile exibido no topo (altura ~200px), oculto se nao configurado
- Formulario abaixo

---

## 5. Hook `useLoginBanner`

Novo arquivo `src/modules/auth/hooks/useLoginBanner.ts`:

- Query anonima na tabela `configuracoes_globais` filtrando `plataforma = 'login_banner'`
- `staleTime` longo (5 minutos) para cache
- Retorna URLs das imagens e cor de fundo

---

## 6. Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migration SQL | INSERT login_banner + bucket + RLS policy anon SELECT |
| `src/modules/auth/hooks/useLoginBanner.ts` | Criar: hook para buscar config publica |
| `src/modules/auth/pages/LoginPage.tsx` | Modificar: layout split com banner responsivo |
| `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx` | Modificar: adicionar aba Login Banner com uploads |
| `src/modules/admin/components/LoginBannerConfig.tsx` | Criar: componente de configuracao com upload |

---

## 7. Detalhes Tecnicos

### RLS para acesso anonimo

```text
Policy: "Anon pode ler login_banner"
ON configuracoes_globais
FOR SELECT
TO anon
USING (plataforma = 'login_banner')
```

### Upload de imagens

- Upload via Supabase Storage SDK para bucket `login-banner`
- Nomes fixos: `desktop.webp`, `tablet.webp`, `mobile.webp` (sobrescreve ao trocar)
- Compressao client-side usando `compressImage` existente em `src/shared/utils/compressMedia.ts`
- Salva URL publica no JSONB

### Responsividade no Login

- Tailwind: `hidden lg:flex` para painel direito no desktop
- `hidden md:flex lg:hidden` para tablet
- `md:hidden` para mobile banner no topo
- Imagens com `object-cover` e `w-full h-full`

### Tamanhos recomendados (exibidos na UI de config)

- Desktop: 960 x 1080px
- Tablet: 768 x 1024px
- Mobile: 390 x 300px

