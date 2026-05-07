/**
 * Sincronizado em {@link ThrottleModule} ao inicializar o `ThrottlerModule`.
 * Permite `@Throttle` com `limit` em função alinhado ao valor resolvido do ambiente.
 */
export const throttleRuntime = {
  limit: 100,
  ttlMs: 60_000,
};

export function syncThrottleRuntime(limit: number, ttlMs: number): void {
  throttleRuntime.limit = limit;
  throttleRuntime.ttlMs = ttlMs;
}

/** Metade do limite global do projeto (mínimo 1 requisição por janela). */
export function getThrottleHalfLimit(): number {
  return Math.max(1, Math.floor(throttleRuntime.limit / 2));
}
