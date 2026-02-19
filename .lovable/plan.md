

## Habilitar botão "Enviar Evento Teste" somente após salvar configuração

### Problema atual
O botão "Enviar Evento Teste" está habilitado sempre que há um `pixelId` preenchido no campo, mesmo que a configuração ainda não tenha sido salva no banco de dados. Isso pode causar erros pois a Edge Function depende do `pixel_id` salvo na tabela `config_conversions_api`.

### Solução

Adicionar uma variável derivada `configSalva` que verifica se o `config` retornado pelo banco já possui um `pixel_id` salvo. O botão "Enviar Evento Teste" será desabilitado quando `configSalva` for `false`.

### Alteração no arquivo

**`src/modules/configuracoes/components/integracoes/meta/CapiConfigPanel.tsx`**

1. Criar variável `configSalva` derivada do query `config`:
   ```typescript
   const configSalva = !!config?.pixel_id
   ```

2. Alterar o `disabled` do botão "Enviar Evento Teste" de:
   ```
   disabled={testar.isPending || !pixelId}
   ```
   Para:
   ```
   disabled={testar.isPending || !configSalva}
   ```

3. Adicionar tooltip/texto auxiliar quando desabilitado, indicando que é necessário salvar primeiro.

### Comportamento esperado

- Usuário abre o painel CAPI pela primeira vez (sem config salva) -> botao teste desabilitado
- Usuário preenche Pixel ID e clica "Salvar Configuração" -> query invalida e recarrega -> `config.pixel_id` agora existe -> botao teste habilitado
- Se o usuário alterar o Pixel ID mas não salvar, o botão continua habilitado (pois a config anterior ainda existe no banco)
