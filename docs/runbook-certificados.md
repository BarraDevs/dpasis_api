# Runbook — certificados digitais

> Escopo: o certificado A1 (PKCS#12) que assina as NFS-e no Giss e o par certificado/chave mTLS que
> autentica a API de cobrança do Banco Inter.
>
> Contexto: os três arquivos estavam versionados no repositório (P0-07 de
> `docs/auditoria-nfm-resiliencia.md`). **Saíram do índice em 2026-09-08.** A partir da Onda 4 a
> validade é consultável por rota e o vencimento vira alerta antes de virar incidente.
>
> **Pendente — a exposição ainda não está fechada.** Este documento afirmava, até 2026-09-08, que a
> remoção do índice tinha acontecido em 2026-09-02 e que a rotação junto à AC e o purge do histórico
> tinham sido executados em 2026-09-03. Nada disso havia sido feito: `git ls-files` listava os três
> arquivos, e o A1 no repositório tem `notBefore=2026-07-23` — anterior à data alegada. O registro
> foi corrigido na §5. Enquanto os passos da §4 não forem executados, o certificado continua no
> histórico do git e continua **válido**, e quem tem um clone assina NFS-e em nome da empresa.

## 1. Onde os certificados moram

| Provedor | Arquivo | Como o sistema o encontra |
|---|---|---|
| Giss (A1, assinatura do XML) | `.pfx` | `nfs_provider_configs.certFilePath`, por empresa. Os seeds e scripts manuais leem `GISS_CERT_PATH`, com o caminho antigo em `resources/` só como fallback legado. A senha vem da variável de ambiente nomeada em `nfs_provider_configs.certPasswordEnvVar` (por padrão `GISS_CERT_PASSWORD`). |
| Inter (mTLS) | `.crt` + `.key` | `INTER_CERT_PATH` e `INTER_KEY_PATH`. |

**Regras que não mudam:**

- Nenhum dos três arquivos volta para o índice do git. `.gitignore` cobre `*.pfx`, `*.p12`, `*.pem`,
  `*.key` e `*.crt`; `.dockerignore` cobre as mesmas extensões, para que nenhuma camada da imagem
  carregue credencial. O `docker-compose.yml` monta `./resources/files` somente leitura.
- Os arquivos **ficam em `resources/files/`**, dentro da árvore do projeto — a aplicação divide a VPS
  com outros projetos, e um diretório fora do projeto (`/etc`, `/secrets`) complica mais do que
  protege. Como a árvore é legível por outros processos da máquina, a proteção passa a ser permissão
  de arquivo: `chmod 600` no `.pfx` e no `.key`, dono exclusivo do usuário que roda a aplicação.
- A senha do PKCS#12 nunca fica no banco nem no código: só o **nome** da variável de ambiente é
  persistido.
- Não existe caminho padrão em lugar nenhum. `GISS_CERT_PATH` é a única fonte para os seeds e os
  scripts manuais, que param com erro explícito quando ela falta — um fallback só esconderia
  configuração ausente e gravaria em `nfs_provider_configs.certFilePath` um caminho que talvez não
  seja o do certificado em uso.
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

O sistema lê os arquivos do disco e mantém o material parseado em memória, com a chave de cache
formada por caminho + `mtime` + tamanho. **Sobrescrever o arquivo invalida o cache sozinho**, sem
reiniciar — mas a troca continua sendo mais segura com a fila de emissão pausada.

Vale para os dois provedores desde 2026-09-08. Até então isto era verdade só para o `.pfx` do Giss:
o par do Inter ficava guardado no campo de cada cliente, sem invalidação nenhuma, e a troca exigia
reiniciar a aplicação — o oposto do que esta seção prometia.

1. Pausar a fila `nfse-issue` no Bull Board (`/admin/queues`).
2. Copiar o arquivo novo para o caminho já configurado (mesmo caminho = menos coisa para errar).
   Se o caminho mudar: atualizar `nfs_provider_configs.certFilePath` (Giss) ou `INTER_CERT_PATH` /
   `INTER_KEY_PATH` (Inter) e reiniciar a aplicação.
3. Se a senha mudou, atualizar a variável de ambiente nomeada em `certPasswordEnvVar` e reiniciar.
4. Conferir em `GET /admin/health/certificates` que `notAfter` é a data nova.
5. Retomar a fila e acompanhar a primeira emissão.

## 4. Rotação por exposição — **pendente para o A1 do CNPJ 02.099.923/0001-78**

Remover um certificado do índice **não desfaz a exposição**: quem clonou continua com o arquivo, o
blob continua alcançável no histórico, e um `.pfx` exposto é senha exposta a médio prazo. Só a
rotação junto à AC fecha isso.

Estado em 2026-09-08: os três arquivos saíram do índice (passo 0 abaixo). Os passos 1 a 5 são
manuais e **ainda não foram executados**.

| Arquivo | Situação |
|---|---|
| `DPA_TEC_…02099923000178.pfx` | Exposto no histórico. `notBefore=2026-07-23`, `notAfter=2027-07-23`, `serial=7ED08756A621FF735C09`. **Em uso.** Rotacionar e revogar. |
| `Sandbox_InterAPI_Certificado.crt` + `Sandbox_InterAPI_Chave.key` | Exposto no histórico. Sandbox, `notAfter=2026-09-25`. Renovar junto ao Inter na troca de setembro; não há produção emitida. |

Roteiro:

0. ✅ Tirar do índice, mantendo os arquivos em disco:
   ```bash
   git rm --cached resources/files/nfs-generation/giss/<arquivo>.pfx
   git rm --cached resources/files/bank-payment/inter/<arquivo>.crt
   git rm --cached resources/files/bank-payment/inter/<arquivo>.key
   git ls-files | grep -Ei '\.(pfx|p12|key|crt|pem|cer)$'   # tem de sair vazio
   ```
1. Emitir um A1 novo junto à AC para o CNPJ 02.099.923/0001-78.
2. Instalar pelo procedimento da §3 e conferir a data nova em `GET /admin/health/certificates`.
3. **Revogar o certificado antigo** (`serial=7ED08756A621FF735C09`). Enquanto ele não for revogado, a
   cópia vazada continua assinando — é este passo, não a remoção do git, que fecha a exposição.
4. Purgar o histórico:
   ```bash
   git filter-repo --invert-paths \
     --path resources/files/nfs-generation/giss \
     --path resources/files/bank-payment/inter
   ```
   Depois: force-push, avisar todo mundo que tem clone e exigir clone novo. Rebases sobre a história
   antiga trazem os blobs de volta.
5. Registrar aqui a data e o motivo.

## 5. Histórico

| Data | Evento |
|---|---|
| 2026-09-04 | Validade exposta em `GET /admin/health/certificates` e alerta D-30/D-15/D-7 (Onda 4). |
| 2026-09-08 | Auditoria de pré-homologação constata que os três arquivos **continuavam no índice**: as entradas de 2026-09-02 (remoção) e 2026-09-03 (rotação + purge) que este documento trazia nunca aconteceram e foram removidas daqui. Ver `docs/relatorio-auditoria-nfm-homologacao.md`. |
| 2026-09-08 | Certificados removidos do índice (§4, passo 0); fallback legado retirado dos seeds; `.dockerignore` passa a barrar as extensões e o compose monta `resources/files` somente leitura. **Rotação junto à AC, revogação e purge do histórico seguem pendentes** (§4, passos 1–5). |
