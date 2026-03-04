# DPASIS API - Postman Collection

Coleção Postman gerada a partir da documentação Swagger/OpenAPI da DPASIS REST API.

## Como importar

1. Abra o **Postman** (app ou web)
2. Clique em **Import**
3. Arraste o arquivo `DPASIS-API.postman_collection.json` ou selecione-o
4. A coleção será importada com todas as rotas configuradas

## Configuração

### Variáveis da coleção

- **baseUrl**: URL base da API (padrão: `http://localhost:3000`)
- **accessToken**: Token JWT para autenticação (preenchido automaticamente após login)

### Fluxo recomendado

1. Ajuste a variável `baseUrl` se sua API estiver em outro endereço
2. Execute a requisição **Login com email e senha** (em Autenticação)
3. O token será salvo automaticamente na variável `accessToken`
4. As demais rotas protegidas usarão o token automaticamente

## Regenerar a coleção

Se a API for atualizada e você exportar um novo `swagger.json`:

```bash
# Coloque o swagger.json em ~/Downloads/ e execute:
npm run generate:postman

# Ou especifique o caminho:
SWAGGER_PATH=/caminho/para/swagger.json npm run generate:postman
```

A coleção será gerada em `postman/DPASIS-API.postman_collection.json`.
