

# Plano de Correcao: Acoes de Automacao (WhatsApp, Email, CRM)

## 1. Status de conexao em Enviar WhatsApp e Enviar Email

**Problema:** Ao selecionar "Enviar WhatsApp" ou "Enviar Email" nas acoes, o usuario nao sabe se tem uma conexao ativa configurada.

**Solucao:**
- No case `enviar_whatsapp`: consultar a tabela `integracoes` (where `plataforma = 'whatsapp'` e status `connected`) via Supabase para exibir um badge de status (Conectado/Desconectado) no topo da configuracao.
- No case `enviar_email`: consultar a tabela `conexoes_email` (where status in `conectado`, `ativo`) para exibir badge similar.
- Ambos exibirao um alerta sutil quando nao houver conexao ativa, orientando o usuario a configurar em /configuracoes/conexoes.
- Preparar campo `conexao_tipo` para futuro suporte a WhatsApp API oficial (WAHA vs API Oficial) e Email (SMTP vs Marketing), salvando no config da acao.

**Arquivo:** `src/modules/automacoes/components/panels/AcaoConfig.tsx`

---

## 2. Upload de audio/imagem/documento no WhatsApp (substituir URL por upload)

**Problema:** Atualmente, para midia (audio, imagem, documento), o usuario precisa colar uma URL publica. Nao pode gravar audio nem anexar arquivo.

**Solucao:**
- Para tipos `imagem` e `documento`: adicionar botao "Anexar arquivo" que faz upload para o bucket `chat-media` (ja publico) do Supabase Storage e preenche automaticamente a `midia_url`.
- Para tipo `audio`: adicionar botao de gravacao usando `MediaRecorder` API (mesmo padrao do modulo /conversas) que grava, faz upload para `chat-media`, e preenche a `midia_url`.
- Manter o campo URL como fallback manual para quem preferir colar link.

**Arquivos:**
- `src/modules/automacoes/components/panels/AcaoConfig.tsx` (adicionar UI de upload/gravacao no case `enviar_whatsapp`)
- Reutilizar o bucket publico `chat-media` existente

---

## 3. Funis e Etapas dinamicos em "Criar oportunidade" e "Mover para etapa"

**Problema:** Campos "Funil" e "Etapa" usam inputs de texto livre pedindo IDs, dificil para o usuario.

**Solucao:**
- Criar sub-componente `FunilEtapaSelect` que:
  1. Consulta `funis` via Supabase (where `arquivado = false` e `deletado_em IS NULL`) para popular dropdown de funis
  2. Ao selecionar um funil, consulta `etapas_funil` (where `funil_id = selecionado` e `deletado_em IS NULL`, order by `ordem`) para popular dropdown de etapas
- Aplicar no case `criar_oportunidade`: dropdown de funil (obrigatorio) + etapa inicial (opcional, primeira etapa por padrao)
- Aplicar no case `mover_etapa`: dropdown de funil + dropdown de etapa destino (obrigatorio)
- Aplicar no case `distribuir_responsavel`: dropdown de funil de referencia

**Arquivo:** `src/modules/automacoes/components/panels/AcaoConfig.tsx`

---

## 4. Validacao do case "Adicionar nota na oportunidade"

**Analise da tabela `anotacoes_oportunidades`:**
- Colunas: `id`, `organizacao_id`, `oportunidade_id`, `usuario_id`, `tipo` (varchar), `conteudo` (text), `audio_url`, `audio_duracao_segundos`, `criado_em`
- O campo `conteudo` ja esta correto para o fluxo
- **Porem, falta o campo `tipo`** na configuracao -- a tabela aceita tipo (ex: `nota`, `observacao`). Vamos adicionar um select para o tipo da nota.
- O `oportunidade_id` sera resolvido em runtime pela Edge Function (vem do contexto do trigger), entao nao precisa de campo no formulario.

**Conclusao:** Adicionar campo `tipo` (default `nota`) ao case `adicionar_nota`.

---

## Resumo tecnico de alteracoes

| Arquivo | Alteracao |
|---|---|
| `AcaoConfig.tsx` | Sub-componentes: `StatusConexao`, `FunilEtapaSelect`, `MediaUploader`. Refatorar cases `enviar_whatsapp`, `enviar_email`, `criar_oportunidade`, `mover_etapa`, `distribuir_responsavel`, `adicionar_nota` |

Nenhuma migracao de banco necessaria -- todas as tabelas ja existem com as colunas corretas.

