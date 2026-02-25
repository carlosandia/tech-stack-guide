

## Plano: Melhorar UX do painel Conversions API (CAPI)

### Problemas identificados

1. **Botao "Salvar" sempre parece ativo** -- deveria mostrar estado "salvo" quando nao ha alteracoes pendentes, e so destacar quando o Pixel ID foi editado
2. **Fluxo confuso para novos usuarios** -- precisa primeiro inserir o Pixel ID e salvar antes de poder testar, mas isso nao esta claro visualmente
3. **Codigo do evento de teste aparece no toast** -- deveria aparecer inline no painel para facilitar copia

### Solucao

#### 1. Deteccao de alteracoes pendentes (dirty state)

Comparar o valor atual do `pixelId` com o valor salvo no banco (`config.pixel_id`). O botao "Salvar" so fica com estilo primario (destaque) quando ha diferencas. Quando nao ha alteracoes, o botao fica em estilo secundario/outline com texto "Salvo" e icone de check.

#### 2. Fluxo guiado por etapas

Quando nao ha Pixel ID salvo ainda:
- Mostrar os eventos de conversao e estatisticas com `opacity-50 pointer-events-none` (desabilitados visualmente)
- Mostrar um texto helper acima dos eventos: "Insira e salve o Pixel ID para configurar os eventos"
- Botao "Enviar Evento Teste" fica desabilitado com tooltip explicativo

Quando ja tem Pixel ID salvo:
- Tudo habilitado normalmente
- Botao "Salvar" so destaca se Pixel ID foi alterado

#### 3. Codigo do evento de teste inline com botao de copiar

Apos o teste bem-sucedido, exibir o `test_event_code` retornado pela API em uma area inline no painel (abaixo do botao de teste), com:
- Badge com o codigo (ex: `TEST_EVENT_1771985260`)
- Botao de copiar (icone Copy) que copia para o clipboard
- Texto helper: "Use este codigo no Gerenciador de Eventos do Meta para verificar"
- Substituir a exibicao no toast -- o toast so mostra "Evento de teste enviado com sucesso!" sem o codigo

#### 4. Recomendacoes de UX adicionais

- Agrupar acoes (Salvar e Testar) de forma mais clara com separador visual
- Mover botao "Salvar" junto ao campo Pixel ID (contexto mais proximo)
- Mostrar estado de sucesso do ultimo teste de forma mais proeminente

### Alteracoes tecnicas

**Arquivo: `src/modules/configuracoes/components/integracoes/meta/CapiConfigPanel.tsx`**

1. Adicionar estado `testEventCode` (string | null) para armazenar o codigo do ultimo teste
2. Criar variavel `temAlteracoes` que compara `pixelId !== (config?.pixel_id || '')`
3. Condicionar estilo do botao "Salvar":
   - Com alteracoes: `bg-primary text-primary-foreground` + texto "Salvar Configuracao"
   - Sem alteracoes: `bg-secondary text-secondary-foreground` + texto "Salvo" + icone CheckCircle2
4. Desabilitar secao de eventos quando `!configSalva` com overlay visual
5. No `onSuccess` do `testar`, extrair `test_event_code` e setar no estado; toast mostra apenas mensagem curta
6. Renderizar bloco inline do codigo de teste com botao de copiar (usando `navigator.clipboard.writeText`)

### Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/modules/configuracoes/components/integracoes/meta/CapiConfigPanel.tsx` | Refatorar UX: dirty state, fluxo guiado, codigo inline |

