

## Criar trigger de reuniao_agendada para o motor de automacao + CAPI

### Situacao atual

- A tabela `reunioes_oportunidades` tem apenas a trigger `audit_reunioes_trigger` (grava no `audit_log`)
- A funcao `emitir_evento_automacao` nao esta vinculada a essa tabela
- O motor de automacao e o `send-capi-event` ja mapeiam `reuniao_agendada` para o evento Meta `Schedule`, mas o evento nunca e emitido no banco

### Sobre a migracao de ativacao dos eventos

A migracao que habilitou `eventos_habilitados` com `lead`, `schedule`, `mql`, `won`, `lost` como `true` **nao deve ser revertida** — esses flags sao necessarios para o funcionamento real do CAPI em producao. O teste validou que tudo funciona corretamente.

### Alteracao necessaria

#### Arquivo: Nova migracao SQL

Criar uma trigger na tabela `reunioes_oportunidades` que chama `emitir_evento_automacao` no INSERT, emitindo o evento `reuniao_agendada` para a fila `eventos_automacao`.

Como a funcao `emitir_evento_automacao` usa `TG_ARGV[0]` para determinar o tipo de entidade, e ela so trata `oportunidade`, `contato` e `tarefa` no INSERT, sera necessario:

1. Criar uma funcao dedicada `emitir_evento_reuniao_agendada()` que insere diretamente na tabela `eventos_automacao` com tipo `reuniao_agendada`
2. Vincular essa funcao como trigger AFTER INSERT na tabela `reunioes_oportunidades`

A funcao buscara o `contato_id` a partir da oportunidade vinculada para que o motor de automacao tenha os dados necessarios para enviar ao CAPI.

### Detalhes tecnicos

```text
Funcao: emitir_evento_reuniao_agendada()
  - Trigger: AFTER INSERT ON reunioes_oportunidades
  - Insere em eventos_automacao:
    - tipo: 'reuniao_agendada'
    - entidade_tipo: 'reuniao'
    - entidade_id: NEW.id
    - dados: {
        titulo: NEW.titulo,
        oportunidade_id: NEW.oportunidade_id,
        contato_id: <buscado da oportunidade>,
        tipo: NEW.tipo,
        data_inicio: NEW.data_inicio
      }
```

### Arquivos

| Arquivo | Acao |
|---------|------|
| Nova migracao SQL | Criar funcao + trigger para emitir evento reuniao_agendada |

### O que NAO sera feito

- Reverter a ativacao dos eventos CAPI (necessarios para producao)
- Alterar a funcao `emitir_evento_automacao` existente (evitar risco de regressao nos outros eventos)
