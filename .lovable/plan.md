

# Adicionar nocache ao script do widget na pagina de Planos

## Alteracao

Adicionar `&nocache=1` na URL do script do widget embed dentro de `src/modules/public/pages/PlanosPage.tsx` (linha 65), para que o formulario sempre carregue a versao mais recente sem cache.

## Detalhe tecnico

**Arquivo:** `src/modules/public/pages/PlanosPage.tsx`

Na linha 65, alterar a URL do script de:
```
...widget-formulario-loader?slug=demonstracao-crm-mlrb6yoz&mode=inline
```
Para:
```
...widget-formulario-loader?slug=demonstracao-crm-mlrb6yoz&mode=inline&nocache=1
```

Isso forca o navegador e o edge function a ignorar o cache de 1h, garantindo que a estilizacao atualizada apareca imediatamente na pagina de planos.

