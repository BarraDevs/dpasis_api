# Referência: Revisão de Frontend

Aplica-se a: React, Vue, Angular, Svelte, vanilla JS/TS, CSS, HTML.

## React / Componentes

### Bugs Comuns
- `useEffect` com dependências erradas → loop infinito ou stale closure
- Estado sendo mutado diretamente (`array.push()` em vez de `[...arr, item]`)
- Chave (`key`) usando índice de array → problema em listas reordenáveis
- Evento não removido em `useEffect` sem cleanup → memory leak
- Condição de corrida em `useEffect` com fetch → resposta antiga sobrescreve nova (falta `AbortController` ou flag de cancelamento)
- `setState` chamado em componente desmontado → warning e possível memory leak
- Referência a `this` em arrow function dentro de classe vs método normal

### Edge Cases
- Componente renderizado com `props` undefined/null quando não esperado
- Lista vazia não tratada (mostra nada em vez de mensagem "sem resultados")
- Estado de loading não gerenciado → flash de conteúdo vazio
- Estado de erro não gerenciado → tela branca silenciosa
- Formulário submetido múltiplas vezes (double submit)

### Segurança Frontend
- `dangerouslySetInnerHTML` sem sanitização → XSS
- `eval()` ou `new Function()` com input do usuário
- URLs não validadas em `href` ou `src` → javascript: protocol injection
- Dados sensíveis em `localStorage` (tokens JWT de longa duração, PII)
- CORS configurado de forma muito permissiva

### Performance
- Componente re-renderiza desnecessariamente → falta `React.memo`, `useMemo`, `useCallback`
- Imagem sem lazy loading ou sem dimensões definidas → layout shift (CLS)
- Bundle grande sem code splitting
- Event listener no `document`/`window` sem remoção

---

## JavaScript / TypeScript Geral

### Bugs
- `typeof null === 'object'` → verificação de null incorreta
- `NaN !== NaN` → use `Number.isNaN()`, não `=== NaN`
- Floating point: `0.1 + 0.2 !== 0.3`
- `parseInt('08')` sem radix → comportamento undefined em ambientes antigos
- Prototype pollution via `Object.assign({}, userInput)` com `__proto__`
- `JSON.parse` sem try/catch → throw em JSON inválido
- Destructuring de undefined → `const { a } = undefined` throws
- `for...in` iterando propriedades herdadas do prototype

### Async
- `Promise` rejeitada sem `.catch()` → unhandled rejection silenciosa
- `await` dentro de `.forEach()` → não aguarda, use `for...of` ou `Promise.all`
- `.catch()` retornando valor → transforma rejeição em resolução (pode mascarar erro)
- Timeout ausente em fetch → requisição pendente indefinidamente
