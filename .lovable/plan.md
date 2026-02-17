

# Correcao: Preservar Mapeamento ao Trocar Tipo de Contato

## Problema

Na etapa 2 do modal de importacao, ao trocar o "Tipo de Contato" entre Pessoa e Empresa, o mapeamento feito pelo usuario e descartado. Isso acontece porque o estado `mapping` nao e recalculado ao mudar o tipo -- os valores mapeados para campos de "Pessoa" (ex: `nome`, `sobrenome`) nao existem na lista de "Empresa" (ex: `razao_social`, `cnpj`), entao os selects voltam para "Ignorar".

## Solucao

### Arquivo: `src/modules/contatos/components/ImportarContatosModal.tsx`

1. **Recalcular o mapeamento automaticamente** ao trocar o tipo de contato (linha 313). Quando o usuario muda de Pessoa para Empresa (ou vice-versa):
   - Manter mapeamentos para campos que existem em ambos os tipos (ex: `email`, `telefone`, `observacoes`)
   - Remover mapeamentos de campos exclusivos do tipo anterior (ex: `nome` so existe em Pessoa, `razao_social` so existe em Empresa)
   - Executar o auto-map novamente para tentar mapear headers restantes aos novos campos disponiveis

2. **Extrair o handler de mudanca de tipo** em uma funcao dedicada para manter o codigo organizado.

### Logica detalhada

```text
Ao mudar tipoContato:
  1. Obter lista de campos validos do novo tipo
  2. Filtrar mapping atual: manter apenas entries cujo valor existe nos campos do novo tipo
  3. Re-executar auto-map para headers ainda nao mapeados
  4. Atualizar mapping com o resultado
```

### Campos compartilhados entre Pessoa e Empresa
- `email`, `telefone`, `observacoes` -- serao preservados na troca

### Campos exclusivos (serao removidos na troca)
- Pessoa: `nome`, `sobrenome`, `cargo`, `linkedin_url`
- Empresa: `razao_social`, `nome_fantasia`, `cnpj`, `website`, `segmento`, `porte`

