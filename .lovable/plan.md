

# Correção: Emails novos não sincronizam

## Causa raiz

O trigger `trg_emitir_evento_email_recebido` na tabela `emails_recebidos` referencia uma coluna inexistente `NEW.remetente`. A coluna correta é `de_email`.

Quando o `sync-emails` tenta inserir novos emails, o trigger dispara e falha com:
```
record "new" has no field "remetente"
```

Isso faz TODOS os inserts falharem, tanto o batch quanto o fallback individual.

## Correção

Atualizar a função do trigger para usar o nome correto da coluna:

- `NEW.remetente` -> `NEW.de_email`

## Detalhes Técnicos

Será executada uma migration SQL para recriar a função `emitir_evento_email_recebido()`:

```sql
CREATE OR REPLACE FUNCTION emitir_evento_email_recebido()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO eventos_automacao (organizacao_id, tipo, entidade_tipo, entidade_id, dados)
    VALUES (NEW.organizacao_id, 'email_recebido', 'email', NEW.id,
      jsonb_build_object(
        'remetente', NEW.de_email,
        'assunto', NEW.assunto,
        'contato_id', NEW.contato_id,
        'oportunidade_id', NEW.oportunidade_id
      ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Arquivo a editar

1. Nova migration SQL para corrigir a função do trigger

