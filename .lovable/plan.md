
# Script Embed Dinamico para Formularios

## Problema Atual
Os formularios sao embedados via **iframe**, o que causa:
- Redirecionamento preso dentro do container (nao redireciona a pagina toda)
- Problemas de CORS/RLS no envio
- Nao e o padrao de mercado para CRMs (HubSpot, RD Station usam script)

## Solucao
Criar um script embed dinamico (igual ao widget WhatsApp) que:
1. Faz fetch da configuracao do formulario via Edge Function publica
2. Renderiza o formulario diretamente no DOM do site
3. Envia dados via Edge Function existente (`processar-submissao-formulario`)
4. Qualquer alteracao no formulario reflete automaticamente sem trocar o script

## Arquitetura

O script gerado sera algo como:
```text
<script data-form-slug="meu-formulario" 
  src="https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/widget-formulario?slug=meu-formulario">
</script>
```

Ou um loader inline que faz fetch e renderiza.

## Etapas de Implementacao

### 1. Nova Edge Function: `widget-formulario-config`
- Rota publica (sem auth)
- Recebe `?slug=xxx` como parametro
- Retorna: dados do formulario, campos, estilos, config de botoes, config pos-envio, LGPD
- Usa `service_role` para ler dados

### 2. Atualizar `generateEmbedCode` em `EmbedCodeCard.tsx`
- Substituir os 3 tipos de embed (inline, modal, sidebar) de iframe para script dinamico
- **Inline**: script que renderiza o formulario num `div` no local onde o script e inserido
- **Modal**: script que cria um botao e ao clicar abre o formulario como overlay
- **Sidebar**: script que cria painel lateral com o formulario
- O script faz fetch para `widget-formulario-config`, monta os campos, labels, mascaras e estilos
- Submit envia para `processar-submissao-formulario` (edge function existente)
- Pos-envio: mostra mensagem de sucesso OU faz `window.location.href` (redireciona a pagina toda)

### 3. Logica do Script Embed
O script gerado tera:
- Fetch da config do formulario (campos, estilos, validacoes, LGPD)
- Renderizacao dos campos com tipos corretos (text, email, tel, number, etc.)
- Mascaras para telefone, CPF, CNPJ, CEP
- Validacao de campos obrigatorios
- Checkbox LGPD quando ativo
- Envio via fetch para a edge function de submissao
- Mensagem de sucesso ou redirecionamento real da pagina
- Captura de UTMs da URL atual do site

### 4. Manter iframe como opcao alternativa
- Adicionar uma 4a opcao "iframe" para quem preferir o metodo tradicional
- Os 3 tipos principais (inline, modal, sidebar) usarao script dinamico

## Detalhes Tecnicos

### Edge Function `widget-formulario-config`
```text
GET /widget-formulario-config?slug=meu-formulario

Response:
{
  formulario: { id, nome, descricao, config_botoes, config_pos_envio, lgpd_* },
  campos: [{ id, nome, label, tipo, obrigatorio, placeholder, ordem, ... }],
  estilos: { container, campos, botao, cabecalho }
}
```

### Arquivos a criar/modificar:
1. **Criar**: `supabase/functions/widget-formulario-config/index.ts` - Edge function publica
2. **Modificar**: `src/modules/formularios/components/compartilhar/EmbedCodeCard.tsx` - Gerar script dinamico ao inves de iframe
3. **Modificar**: `supabase/config.toml` - Adicionar `verify_jwt = false` para a nova function

### Seguranca
- A edge function retorna apenas dados publicos (config visual, campos, labels)
- Nao expoe dados de submissoes ou dados internos
- O envio usa a edge function existente que ja tem validacao propria
- O slug e publico por natureza (ja esta na URL do formulario)
