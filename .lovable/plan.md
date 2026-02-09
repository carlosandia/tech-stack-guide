
# Plano: Mascaras, Rota Publica, e Pos-Envio nos Botoes

## 1. Rota publica `/f/:slug` - Link direto nao funciona

**Problema**: Nao existe uma rota `/f/:slug` no `App.tsx`. O link direto, embed e QR Code apontam para essa URL, mas ela cai no catch-all `*` que redireciona para `/`. O formulario nunca e exibido publicamente.

**Solucao**:
- Criar pagina `src/modules/formularios/pages/FormularioPublicoPage.tsx` que:
  - Busca o formulario pelo slug (query publica sem autenticacao)
  - Busca os campos do formulario
  - Renderiza o formulario completo com estilos aplicados
  - Captura UTMs da URL (`utm_source`, `utm_medium`, `utm_campaign`) e armazena para envio junto com a submissao
  - Permite preenchimento e submissao (insert na tabela `submissoes_formularios`)
  - Exibe mensagem de sucesso/redirecionamento conforme `config_pos_envio`
- Adicionar rota `<Route path="/f/:slug" element={<FormularioPublicoPage />} />` no `App.tsx` (fora do layout autenticado)
- Criar funcao `buscarPorSlug(slug)` no `formularios.api.ts` que faz SELECT publico (precisa de RLS policy para leitura publica de formularios publicados)

**Sobre UTMs**: A logica de construcao de URL no `LinkDiretoCard` esta correta. Os UTMs serao capturados pela pagina publica via `useSearchParams` e armazenados na submissao.

**Sobre Embed e QR Code**: Funcionarao automaticamente assim que a rota publica existir, pois ambos apontam para `/f/:slug`. O QR Code usa API externa (qrserver.com) que nao depende de autenticacao.

---

## 2. Mascaras em todos os campos no preview

**Problema**: Campos como `telefone`, `telefone_br`, `cpf`, `cnpj`, `cep`, `moeda` nao possuem mascaras interativas no preview. Apenas placeholders estaticos.

**Solucao**: 
- Criar helper `src/modules/formularios/utils/masks.ts` com funcoes de mascara puras (sem dependencia de lib externa):
  - `maskCPF(value)` - `000.000.000-00`
  - `maskCNPJ(value)` - `00.000.000/0000-00`  
  - `maskCEP(value)` - `00000-000`
  - `maskTelefone(value)` - `(00) 00000-0000`
  - `maskTelefoneInternacional(value)` - `+00 00000-0000`
  - `maskMoeda(value)` - `R$ 0,00`
- No `renderFinalCampo` (FormPreview.tsx), usar `onChange` com mascaras nos inputs correspondentes para que o usuario veja a formatacao em tempo real
- Na pagina publica (`FormularioPublicoPage`), reutilizar as mesmas mascaras

---

## 3. Mover Pos-Envio para dentro do BotaoConfigPanel

**Problema**: A configuracao de pos-envio (mensagem sucesso, erro, redirecionamento) esta na aba "Configuracoes" separada dos botoes. Faz mais sentido estar junto com a configuracao dos botoes.

**Solucao**:
- Adicionar uma terceira sub-aba no `BotaoConfigPanel`: **"Pos-Envio"** (alem de "Estilo" e "Configuracao")
- Mover o conteudo do `ConfigPosEnvioForm` (mensagem sucesso, mensagem erro, acao apos envio, URL redirecionamento, tempo) para essa nova aba
- Remover o `enviar_url_redirecionamento` da aba "Configuracao" (ja que estara no Pos-Envio)
- Remover `ConfigPosEnvioForm` do `EditorTabsConfig.tsx`
- O salvamento continua usando `config_pos_envio` no formulario

---

## Detalhes Tecnicos

### Arquivos a criar:
1. **`src/modules/formularios/pages/FormularioPublicoPage.tsx`** - Pagina publica do formulario com renderizacao completa, mascaras, captura de UTMs e submissao
2. **`src/modules/formularios/utils/masks.ts`** - Funcoes de mascara puras para CPF, CNPJ, CEP, telefone, moeda

### Arquivos a modificar:

1. **`src/App.tsx`** - Adicionar `<Route path="/f/:slug" element={<FormularioPublicoPage />} />` nas rotas publicas
2. **`src/modules/formularios/services/formularios.api.ts`**:
   - Adicionar `buscarPorSlug(slug)` para busca publica
   - Adicionar `listarCamposPublico(formularioId)` para busca publica de campos
   - Adicionar `enviarSubmissao(formularioId, dados, utms)` para criar submissao
3. **`src/modules/formularios/components/editor/FormPreview.tsx`** - Integrar mascaras nos inputs do `renderFinalCampo` (onChange com mask)
4. **`src/modules/formularios/components/config/BotaoConfigPanel.tsx`**:
   - Adicionar terceira aba "Pos-Envio"
   - Integrar campos de mensagem sucesso/erro, acao apos envio, URL redirecionamento
   - Carregar e salvar `config_pos_envio` junto com `config_botoes`
   - Remover `enviar_url_redirecionamento` da aba Config (movido para Pos-Envio)
5. **`src/modules/formularios/components/editor/EditorTabsConfig.tsx`** - Remover `ConfigPosEnvioForm` e seu import

### Consideracoes de seguranca:
- A rota publica precisara de uma RLS policy permitindo SELECT em `formularios` e `campos_formularios` onde `status = 'publicado'` e sem autenticacao (anon)
- INSERT na tabela `submissoes_formularios` tambem precisara de policy anon
- Validacao server-side dos dados submetidos
- Sanitizacao de HTML no campo `bloco_html` com DOMPurify (ja instalado no projeto)
