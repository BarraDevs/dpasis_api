# Referência: Revisão de Segurança

Use este arquivo quando o código lidar com autenticação, autorização, criptografia, tokens, senhas ou dados sensíveis.

## Autenticação

- Senha comparada com `==` em vez de comparação de tempo constante → timing attack
- Hash de senha com MD5/SHA1 → quebrável; use bcrypt, argon2, scrypt
- Senha sem salt → rainbow table attack
- Token de sessão previsível ou curto → brute force
- Ausência de expiração em tokens → token roubado válido para sempre
- Refresh token sem rotação → roubo de refresh token não detectado
- "Lembrar senha" armazenando senha em plaintext em cookie

## Autorização

- Verificação de permissão só no frontend → bypassável
- IDOR (Insecure Direct Object Reference): `GET /orders/{id}` sem verificar se o usuário dono do pedido é o autenticado
- Escalada de privilégio: usuário normal pode virar admin alterando um campo
- JWT: algoritmo `none` aceito → qualquer token aceito sem verificação
- JWT: segredo fraco ou hardcoded
- JWT: apenas `exp` verificado, mas não `iss`, `aud` ou `nbf`

## Criptografia

- IV/nonce fixo ou reutilizado em AES → cifra quebrável
- ECB mode em AES → patterns visíveis no ciphertext
- `Math.random()` para gerar tokens/segredos → não é CSPRNG
- Chave derivada de senha com apenas SHA256 sem KDF (PBKDF2/argon2)
- Certificado SSL/TLS não verificado em chamadas HTTP internas → MITM

## Dados Sensíveis

- PII/credenciais em logs (debug, error logs)
- Dados sensíveis em query string de URL → aparecem em logs de servidor, browser history
- Dados sensíveis em mensagens de erro retornadas ao cliente
- Dados sensíveis sem criptografia em banco
- Dados sensíveis em `git blame` / histórico de commits

## Injeção

| Tipo | Vetor | Exemplo de Código Vulnerável |
|------|-------|------------------------------|
| SQL Injection | Query montada por concatenação | `"SELECT * FROM users WHERE id = " + userId` |
| Command Injection | Shell com input do usuário | `exec("ls " + userPath)`, `shell=True` |
| Path Traversal | Caminho de arquivo não sanitizado | `open(basePath + filename)` |
| XSS | HTML renderizado sem escape | `innerHTML = userInput` |
| SSRF | URL fornecida pelo usuário em requisição interna | `fetch(userUrl)` sem allowlist |
| XXE | XML parser com entidades externas habilitadas | `XMLParser(resolve_entities=True)` |
| Template Injection | Template renderizado com input direto | `render_template_string(userInput)` |

## Checklist Rápido de Segurança

- [ ] Nenhum segredo hardcoded (token, senha, API key)
- [ ] Input do usuário nunca concatenado diretamente em query/comando/path
- [ ] Autenticação verificada antes de qualquer operação sensível
- [ ] Autorização verifica ownership/scope, não só "está logado"
- [ ] Erros não expõem detalhes internos ao cliente
- [ ] Dados sensíveis não aparecem em logs
- [ ] Criptografia usa algoritmos modernos e seguros
- [ ] Tokens têm expiração e são gerados com CSPRNG
