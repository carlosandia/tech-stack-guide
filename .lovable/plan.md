
# Correção: Email Lento e Não Entregue

## Causa Raiz Identificada

O problema está na função `conn.write()` do Deno. Quando o corpo da mensagem MIME (com anexo base64) é grande (~100KB+), o `conn.write()` pode **não enviar todos os bytes de uma vez** -- ele retorna quantos bytes foram escritos, mas o código ignora esse retorno.

**O que acontece:**
1. O servidor SMTP aceita o comando DATA (responde 354)
2. O código tenta enviar toda a mensagem MIME (~100KB) com um único `conn.write()`
3. Apenas parte dos bytes é enviada
4. O servidor SMTP fica esperando o restante da mensagem (incluindo o terminador `\r\n.\r\n`)
5. Após ~60 segundos sem receber o terminador, o servidor fecha a conexão
6. O código captura o erro "close_notify" e **falsamente reporta sucesso**

Resultado: o email nunca é entregue, mas o sistema diz "Email enviado com sucesso!"

## Correções

### 1. Implementar `writeAll` para garantir envio completo

Criar uma função auxiliar que faz loop no `conn.write()` até que todos os bytes sejam enviados:

```text
writeAll(conn, data):
  offset = 0
  while offset < data.length:
    bytesWritten = conn.write(data[offset:])
    offset += bytesWritten
```

### 2. Separar envio do DATA body do `sendCommand`

O DATA body não deve passar pelo `sendCommand` genérico (que loga, adiciona `\r\n`, etc). Em vez disso:
- Usar `sendCommand("DATA")` apenas para o comando DATA
- Escrever o corpo da mensagem diretamente com `writeAll`
- Ler a resposta 250 separadamente

### 3. Não tratar close_notify como sucesso

Atualmente, qualquer erro "close_notify" é tratado como sucesso. Corrigir para:
- Adicionar flag `dataAccepted` que só fica `true` após receber 250 no DATA
- No catch de close_notify, só reportar sucesso se `dataAccepted === true`

### 4. Download paralelo de anexos

Atualmente, os anexos são baixados sequencialmente do Storage. Usar `Promise.all` para baixar em paralelo, economizando tempo.

---

## Detalhes Técnicos

### Arquivo: `supabase/functions/send-email/index.ts`

**Nova função `writeAll`:**
```typescript
async function writeAll(conn, data: Uint8Array) {
  let offset = 0;
  while (offset < data.length) {
    const n = await conn.write(data.subarray(offset));
    if (n === null || n === 0) throw new Error("Falha ao escrever no socket");
    offset += n;
  }
}
```

**Refatorar envio do DATA body (dentro de `sendSmtpEmail`):**
- Após receber 354, escrever a mensagem diretamente com `writeAll(conn, encoder.encode(message + "\r\n"))`
- Ler resposta com `readResponse(dataTimeout)` 
- Logar apenas tamanho da mensagem (não o conteúdo inteiro)

**Flag de controle para close_notify:**
- Adicionar `let dataResponseOk = false` antes do bloco try
- Setar `dataResponseOk = true` após receber 250 do DATA
- No catch: só retornar sucesso se `dataResponseOk`

**Download paralelo de anexos:**
```typescript
const downloads = anexos.map(async (anexo) => {
  const { data, error } = await supabaseAdmin.storage
    .from("email-anexos").download(anexo.storage_path);
  // ... processar
});
const resultados = await Promise.all(downloads);
```

**Substituir `sendCommand` no `conn.write`:**
- Trocar `await conn.write(encoder.encode(cmd + "\r\n"))` por `await writeAll(conn, encoder.encode(cmd + "\r\n"))` em todos os pontos
