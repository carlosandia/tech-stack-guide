

# Correcao: Modal "Ver Termos" no Widget Embedado

## Problema
O modal de "Termos de Uso" abre por detras dos elementos do site hospedeiro porque o `z-index: 100000` nao e suficiente em sites com stacking contexts complexos. Alem disso, a fonte do modal nao herda o `fontFamily` do formulario, resultando em estilizacao inconsistente.

## Solucao

### Arquivo: `supabase/functions/widget-formulario-loader/index.ts`

**1. Z-index maximo no overlay e modal dos termos (linha 106)**

Alterar o `z-index` do overlay de `100000` para `2147483647` (valor maximo suportado pelos browsers), garantindo que o modal fique sempre por cima de qualquer elemento do site hospedeiro.

**2. Heranca de fonte no modal**

O modal dos termos precisa receber o `fontFamily` do formulario. Atualmente a funcao `renderField` ja recebe `fontFamily` como parametro, porem o modal nao o utiliza. Sera adicionado `font-family` explicito em:
- Overlay
- Header do modal (titulo)
- Body do modal (conteudo dos termos)
- Botao de fechar

**3. Estilizacao refinada do modal**

Aplicar estilos mais robustos e modernos:
- `font-family` explicito usando a variavel `fontFamily` do formulario
- Titulo com `font-family` herdada
- Corpo com `font-family` herdada e `line-height: 1.6`
- Overlay com `backdrop-filter: blur(4px)` para efeito de desfoque moderno

## Detalhes tecnicos

Na linha 106 (`checkbox_termos`), o bloco que cria o modal sera atualizado:

```text
Antes:
overlay.style.cssText = '...z-index:100000;...'
modal title/body sem font-family explicito

Depois:
overlay.style.cssText = '...z-index:2147483647;backdrop-filter:blur(4px);...'
mTitle.style.cssText = '...font-family:'+fontFamily+';...'
mBody.style.cssText = '...font-family:'+fontFamily+';...'
mClose.style.cssText = '...font-family:'+fontFamily+';...'
```

A funcao `renderField` ja recebe `fontFamily` como parametro, entao basta referencia-lo dentro do evento de click do link "Ver termos".

**4. Deploy da Edge Function**

Apos a edicao, redeploy de `widget-formulario-loader`.

## Resultado esperado
- Modal sempre aparece por cima de todos os elementos do site
- Fundo escurece com blur sutil
- Fonte do modal identica a do formulario
- Funciona corretamente em desktop e mobile
