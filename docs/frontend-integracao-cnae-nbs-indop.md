# Integração frontend — Correspondência CNAE/NBS/INDOP (`/admin/cnae-nbs-indop`)

## Introdução

Cadastro da trinca CNAE + NBS + INDOP usada em itens de cliente e na emissão NFM/NFS-e.

**Referência OpenAPI:** Swagger em `/swagger`, tag das rotas de tributação / CNAE-NBS-INDOP.

## Breaking — `serviceListItemCode` (LC 116)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `serviceListItemCode` | string (máx. 10) | **Sim no Create** (ex.: `"01.07"`) |

- Persiste no banco como nullable (linhas antigas podem ser `null`).
- **Não há Edit** deste recurso: para corrigir LC 116, desative/delete (se permitido) e **recrie** a correspondência.
- Emissão NFM (`POST /admin/nfm`) **falha** o grupo se `serviceListItemCode` estiver ausente.

### Create — body mínimo

```json
{
  "cnaeId": 1,
  "nbsId": 2,
  "indopId": 3,
  "serviceListItemCode": "01.07"
}
```

### Response de leitura

DTO passa a incluir `serviceListItemCode: string | null` junto de `cnae` / `nbs` / `indop`.

## Checklist frontend

1. Formulário de create: campo obrigatório **Item lista serviço (LC 116)**.
2. Listagem: exibir o código; `null` → alertar que emissão NFM vai falhar até recriar.
3. Sem tela de edit: UX de “recriar correspondência” se o código estiver errado.
