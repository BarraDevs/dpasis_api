# Referência: Revisão de Infraestrutura / IaC / Docker / Kubernetes

## Docker

### Segurança
- Imagem rodando como `root` sem necessidade → use `USER nonroot`
- Secrets em `ENV` ou `ARG` no Dockerfile → ficam visíveis em `docker inspect` e layers
- Imagem base `latest` sem pin de versão → build não determinístico, pode quebrar
- `ADD` com URL externa → download não verificado; prefira `COPY` + verificação de hash
- Porta exposta desnecessariamente (`EXPOSE` ou `-p 0.0.0.0:port`)

### Corretude
- `COPY . .` copiando node_modules/venv/.git → imagem enorme e lenta
- `.dockerignore` ausente ou incompleto
- Múltiplos `RUN` sem aproveitar layer cache → build lento
- Processo principal não é PID 1 → sinais (SIGTERM) não chegam à aplicação → shutdown forçado
- Health check ausente → orquestrador não sabe se app está pronto

---

## Kubernetes / Helm

### Segurança
- `securityContext` ausente: container rodando como root, com capabilities desnecessárias
- Secrets como variáveis de ambiente em vez de volumes montados (aparecem em logs)
- RBAC muito permissivo: `ClusterRole` com `*` em resources e verbs
- `hostNetwork: true` ou `hostPID: true` sem necessidade
- Imagem sem tag ou com `latest` → rollout não determinístico

### Confiabilidade
- `resources.limits` e `resources.requests` ausentes → OOMKill ou CPU throttling
- Apenas 1 réplica sem PodDisruptionBudget → zero downtime deploy impossível
- Liveness probe igual a readiness probe → pod reiniciado sob carga em vez de removido do balanceamento
- `terminationGracePeriodSeconds` insuficiente para o app desligar corretamente
- ConfigMap/Secret sem versão no nome → mudança não causa rollout automático

---

## Terraform / IaC Geral

### Segurança
- S3 bucket público sem necessidade
- Security group com `0.0.0.0/0` em portas internas (banco, admin)
- IAM role/policy com `*` em `Action` ou `Resource`
- Logs desabilitados em serviços críticos (CloudTrail, VPC Flow Logs)
- Encryption at rest desabilitada em banco/storage

### Corretude
- `depends_on` ausente quando há dependência implícita entre recursos
- `count` ou `for_each` mudando de estratégia em recurso existente → força destroy/recreate
- `terraform.tfstate` em repositório git → expõe secrets e causa conflitos
- Sem remote state locking → dois applies simultâneos corrompem state
- `destroy` não testado → plano de rollback inexistente
