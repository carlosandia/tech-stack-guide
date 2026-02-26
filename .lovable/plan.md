

# Mensagem Orientativa para Canal sem Leads

## Comportamento Atual (Correto)

- **"Todos"**: mostra TODAS as oportunidades do periodo + investimento total (R$ 5.000). Isso esta correto -- e a visao geral de eficiencia do marketing total.
- **"Panfleto"**: mostra 0 leads porque nenhuma oportunidade tem `origem = panfleto`. O sistema filtra corretamente, mas nao existem dados.
- **"Meta Ads"**: tambem mostraria 0 se nenhuma oportunidade tiver utm_source = facebook/instagram.

O investimento de R$ 5.000 em "Todos" e a soma de Panfleto (R$ 2.000) + Meta Ads (R$ 3.000). Isso e correto e util: mostra a eficiencia do marketing total.

## O que Precisa Mudar

Quando um canal retorna 0 leads, exibir uma mensagem orientativa em vez de apenas numeros zerados. Isso evita confusao.

## Alteracao

### Arquivo: `src/modules/app/components/dashboard/FunilConversao.tsx`

Adicionar um alerta informativo entre os chips de canal e os cards do funil, visivel apenas quando:
1. Um canal especifico esta selecionado (nao "Todos")
2. O total de leads retornado e 0

Mensagem:

```text
Nenhuma oportunidade vinculada a este canal no periodo.
Para que os dados aparecam aqui, defina a Origem como "Panfleto" 
no card da oportunidade em Negocios.
```

Isso orienta o usuario sobre como vincular leads ao canal de investimento.

## Detalhes Tecnicos

- Condicao: `canalFiltro !== null && dadosEfetivos.funil.total_leads === 0`
- Componente: um `div` com icone de info e texto explicativo, estilizado com `bg-muted/30 border border-border rounded-lg`
- O nome do canal vem de `canalToLabel(canalFiltro)` para exibir o nome formatado
- Nenhuma alteracao de logica ou backend necessaria
