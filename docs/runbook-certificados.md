# Runbook — certificados digitais

> Escopo: o certificado A1 (PKCS#12) que assina as NFS-e no Giss e o par certificado/chave mTLS que
> autentica a API de cobrança do Banco Inter.
>
> Contexto: os três arquivos estavam versionados no repositório (P0-07 de
> `docs/auditoria-nfm-resiliencia.md`). Saíram do índice na Onda 1 (2026-09-02); a rotação do A1
> junto à AC e o purge do histórico foram executados em 2026-09-03. A partir da Onda 4 a validade é
> consultável por rota e o vencimento vira alerta antes de virar incidente.

## 1. Onde os certificados moram

| Provedor | Arquivo | Como o sistema o encontra |
|---|---|---|
| Giss (A1, assinatura do XML) | `.pfx` | `nfs_provider_configs.certFilePath`, por empresa. Os seeds e scripts manuais leem `GISS_CERT_PATH`, com o caminho antigo em `resources/` só como fallback legado. A senha vem da variável de ambiente nomeada em `nfs_provider_configs.certPasswordEnvVar` (por padrão `GISS_CERT_PASSWORD`). |
| Inter (mTLS) | `.crt` + `.key` | `INTER_CERT_PATH` e `INTER_KEY_PATH`. |

**Regras que não mudam:**

- Nenhum dos três arquivos volta para o repositório. Em produção, volume montado ou secret manager,
  sempre fora da árvore do projeto.
- A senha do PKCS#12 nunca fica no banco nem no código: só o **nome** da variável de ambiente é
  persistido.
- Um `.pfx` é atacável offline por força bruta, sem limite de tentativas e sem deixar rastro. Quem
  obtém o arquivo emite NFS-e em nome da empresa; trate cada cópia como credencial de produção.

## 2. Conferir a validade

```
GET /admin/health/certificates      # ADMIN + claim COMPANY_NFS_CONFIG_READ
```

Resposta, uma linha por certificado:

```json
{
  "status": "EXPIRING",
  "certificates": [
    {
      "provider": "giss",
      "owner": "companyId=1 · IM 16895",
      "path": "/secrets/giss/dpatec.pfx",
      "notAfter": "2027-06-30T23:59:59.000Z",
      "daysToExpire": 299,
      "status": "OK",
      "message": null
    },
    {
      "provider": "INTER",
      "owner": "mTLS da API de cobrança",
      "path": "/secrets/inter/cert.crt",
      "notAfter": "2026-09-25T00:00:00.000Z",
      "daysToExpire": 21,
      "status": "EXPIRING",
      "message": null
    }
  ]
}
```

| `status` | Significado | Ação |
|---|---|---|
| `OK` | Mais de 30 dias de validade. | Nenhuma. |
| `EXPIRING` | 30 dias ou menos. | Iniciar a renovação **hoje**: emitir um A1 junto à AC leva dias. |
| `EXPIRED` | Já venceu. | A emissão está parada. Substituir o arquivo e reiniciar a aplicação. |
| `ERROR` | Não deu para ler: caminho errado, senha ausente, arquivo corrompido. | Conferir `certFilePath`/`INTER_CERT_PATH` e a variável de senha. |

O campo `status` no topo é o pior dos certificados. A rota nunca falha por causa de um certificado
ruim — um healthcheck que cai junto com o problema que deveria reportar não serve para nada.

**Alerta automático:** todo dia às 07:00 (America/Sao_Paulo) a varredura manda um e-mail
(`AlertType.CertificateExpiring`, digest de 23h) quando algum certificado está a 30, 15 ou 7 dias do
vencimento, já venceu, ou não pôde ser lido.

## 3. Trocar um certificado

O sistema lê o `.pfx` do disco e mantém o material parseado em memória, com a chave de cache formada
por caminho + `mtime` + tamanho. **Sobrescrever o arquivo invalida o cache sozinho**, sem reiniciar —
mas a troca continua sendo mais segura com a fila de emissão pausada.

1. Pausar a fila `nfse-issue` no Bull Board (`/admin/queues`).
2. Copiar o arquivo novo para o caminho já configurado (mesmo caminho = menos coisa para errar).
   Se o caminho mudar: atualizar `nfs_provider_configs.certFilePath` (Giss) ou `INTER_CERT_PATH` /
   `INTER_KEY_PATH` (Inter) e reiniciar a aplicação.
3. Se a senha mudou, atualizar a variável de ambiente nomeada em `certPasswordEnvVar` e reiniciar.
4. Conferir em `GET /admin/health/certificates` que `notAfter` é a data nova.
5. Retomar a fila e acompanhar a primeira emissão.

## 4. Rotação por exposição

Remover um certificado do repositório **não desfaz a exposição**: quem clonou continua com o
arquivo, e um `.pfx` exposto é senha exposta a médio prazo. Rotacionar junto à AC é obrigatório —
foi o que se fez em 2026-09-03 com o A1 do CNPJ 02.099.923/0001-78.

Roteiro:

1. Emitir um certificado novo junto à AC (revoga o anterior, ou pelo menos o substitui em uso).
2. Instalar pelo procedimento da §3.
3. Revogar o certificado antigo junto à AC. Enquanto ele não for revogado, a cópia vazada continua
   assinando.
4. Purgar o histórico do git (`git filter-repo`), avisar quem tem clone e forçar novo clone.
5. Registrar aqui a data e o motivo.

## 5. Histórico

| Data | Evento |
|---|---|
| 2026-09-02 | Certificados removidos do índice; `GISS_CERT_PATH` passa a ser a fonte da verdade (Onda 1). |
| 2026-09-03 | A1 do Giss rotacionado junto à AC e histórico do git purgado (P0-07 fechado). |
| 2026-09-04 | Validade exposta em `GET /admin/health/certificates` e alerta D-30/D-15/D-7 (Onda 4). |
