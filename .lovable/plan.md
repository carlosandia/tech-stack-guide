
## Correcao: Campos CRM duplicados e categoria Endereco inexistente

### Problema

O dropdown de "Campo do CRM" monta a lista de duas fontes que se sobrepoe:

1. Lista hardcoded `CAMPOS_PADRAO_SISTEMA` (Pessoa, Empresa, Endereco, Oportunidade)
2. Consulta ao banco `campos_customizados` (que ja contem campos de sistema + customizados)

Resultado:
- Pessoa aparece 2x (hardcoded + banco)
- Empresa aparece 2x (hardcoded + banco como "Empresa (Customizado)")
- Endereco aparece sem existir no banco
- Campos de sistema e customizados ficam em grupos separados desnecessariamente

### Solucao

Remover a lista hardcoded `CAMPOS_PADRAO_SISTEMA` por completo. Usar **somente** os campos vindos da tabela `campos_customizados`, agrupados por entidade (Pessoa, Empresa, Oportunidade) sem distinção entre sistema e customizado.

### Alteracoes no arquivo

**Arquivo:** `src/modules/configuracoes/components/integracoes/meta/LeadAdsFormMappingModal.tsx`

1. **Remover** a constante `CAMPOS_PADRAO_SISTEMA` (linhas 28-58)

2. **Reescrever** o `useMemo` `camposCrmAgrupados` para agrupar apenas pelos dados do banco:

```typescript
const camposCrmAgrupados = useMemo(() => {
  const ENTIDADE_LABEL: Record<string, string> = {
    pessoa: 'Pessoa',
    empresa: 'Empresa',
    oportunidade: 'Oportunidade',
  }
  const grupos: Record<string, Array<{ value: string; label: string }>> = {}
  for (const c of camposCustomizados || []) {
    const grupoLabel = ENTIDADE_LABEL[c.entidade] || c.entidade
    if (!grupos[grupoLabel]) grupos[grupoLabel] = []
    grupos[grupoLabel].push({
      value: c.sistema ? `${c.entidade}:${c.slug}` : `custom:${c.id}`,
      label: c.nome,
    })
  }
  return grupos
}, [camposCustomizados])
```

3. **Atualizar a query** de `campos_customizados` para incluir o campo `sistema`:

```typescript
.select('id, nome, entidade, slug, sistema')
```

4. **Atualizar** a funcao `autoMapField` para manter compatibilidade com os valores `entidade:slug`.

### Resultado esperado

- Um unico grupo "Pessoa" com todos os campos (sistema + customizados juntos)
- Um unico grupo "Empresa" com todos os campos juntos
- Um unico grupo "Oportunidade" com todos os campos juntos
- Sem grupo "Endereco"
- Sem duplicatas
