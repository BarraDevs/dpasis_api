# Referência: Revisão de Backend / APIs

Aplica-se a: Node.js, Python, Java, Go, Ruby, PHP, C#, Rust e qualquer serviço/API.

## APIs REST / GraphQL

### Segurança
- Endpoint sem autenticação → qualquer um pode chamar
- Autorização ausente → usuário autenticado acessa dados de outro usuário (IDOR)
- Input não validado no servidor (validação só no frontend é insuficiente)
- Retorno de stack trace ou detalhes internos em erros de produção → information leakage
- Rate limiting ausente em endpoints de login, criação de conta, envio de email
- Mass assignment → `User.update(params)` sem whitelist de campos permitidos
- Paginação ausente → endpoint que retorna tudo de uma tabela com milhões de registros
- Verbos HTTP incorretos (GET que modifica estado → vulnerável a CSRF)

### Lógica de Negócio
- Verificação de permissão feita depois de buscar/modificar dados
- Operação não atômica que deveria ser (duas queries sem transação)
- Estado inconsistente se a segunda de duas operações dependentes falha
- Idempotência ausente em endpoints que deveriam ser idempotentes (retry seguro?)

### Tratamento de Erros
- `try/catch` vazio ou com apenas `console.log` → erro silenciado
- Erro de banco exposto diretamente ao cliente
- Timeout ausente em chamadas a serviços externos
- Retry sem limite ou sem backoff exponencial → thundering herd
- Não diferenciar erros de negócio (4xx) de erros de sistema (5xx)

---

## Python Específico

- `except Exception: pass` → engole qualquer erro silenciosamente
- Mutável como argumento default: `def f(lst=[])` → compartilhado entre chamadas
- `is` vs `==` para comparar strings/números (funciona por acaso com interning)
- `open()` sem context manager (`with`) → arquivo não fechado se ocorrer exceção
- `time.sleep()` bloqueando thread em código async
- Injeção via `subprocess` com `shell=True` e input do usuário
- `pickle.loads()` com dados não confiáveis → execução de código arbitrário
- GIL: threads Python não paralelizam CPU-bound (use multiprocessing ou async)

---

## Java / JVM Específico

- `NullPointerException` em Optional não verificado
- `==` comparando Strings em vez de `.equals()`
- `ArrayList` não sincronizado em ambiente multi-thread
- `catch (Exception e) {}` silenciando tudo
- Recursos (streams, connections) não fechados em `finally` ou try-with-resources
- `SimpleDateFormat` não é thread-safe
- Integer cache: `Integer a = 200; Integer b = 200; a == b` é false (fora do range -128..127)

---

## Go Específico

- Goroutine leak: goroutine lançada sem mecanismo de cancelamento/shutdown
- `nil` map: escrever em nil map causa panic
- Erro ignorado: `result, _ := ...` descartando erro
- Race condition: variável compartilhada entre goroutines sem mutex ou channel
- `defer` em loop → executa só no fim da função, não na iteração
- Slice header vs underlying array: modificar slice pode afetar o original inesperadamente
