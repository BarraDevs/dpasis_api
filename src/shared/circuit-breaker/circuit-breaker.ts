import { TransientProviderError } from '../errors/transient-provider.error';

/** Lançado quando o circuito está aberto: a chamada nem chega a sair. */
export class CircuitOpenError extends TransientProviderError {
  constructor(message: string, retryAfterSeconds?: number) {
    super(message, retryAfterSeconds);
    this.name = 'CircuitOpenError';
  }
}

type CircuitState = {
  consecutiveFailures: number;
  openedUntilMs: number | null;
  probeInFlight: boolean;
};

export type CircuitBreakerOptions = {
  /** Falhas transitórias seguidas antes de abrir. */
  failureThreshold?: number;
  /** Quanto tempo o circuito fica aberto antes da primeira sonda. */
  openDurationMs?: number;
  /** O que conta como falha do provedor. Erro de negócio não deve abrir circuito nenhum. */
  shouldTrip?: (error: unknown)=> boolean;
};

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_OPEN_DURATION_MS = 60_000;

/**
 * Disjuntor por chave, em memória.
 *
 * Com o provedor fora do ar, cada job paga o custo inteiro — handshake TLS, parse do PKCS#12, o
 * timeout completo — antes de falhar. Multiplicado pela fila de um fechamento, isso vira uma hora
 * de espera para descobrir o que a primeira chamada já sabia. Aberto o circuito, as chamadas
 * seguintes falham de imediato e o job volta para a escada de reagendamento, que é onde ele deveria
 * estar.
 *
 * **O estado é por processo, não distribuído.** Com N réplicas há N disjuntores, cada um precisando
 * das próprias falhas para abrir. É deliberado: coordenar isso exigiria contador atômico no Redis, e
 * o objetivo aqui não é decidir em conjunto — é não gastar o timeout inteiro em cada job.
 *
 * Meia-abertura com sonda única: passado `openDurationMs`, **uma** chamada atravessa. Se passar, o
 * circuito fecha; se falhar, reabre pelo mesmo período. As demais continuam sendo recusadas na hora,
 * para que a volta do provedor não seja recebida com a fila inteira de uma vez.
 */
export class CircuitBreaker {
  private static readonly circuits = new Map<string, CircuitState>();

  public static async run<T>(key: string, operation: ()=> Promise<T>, options: CircuitBreakerOptions = {}): Promise<T> {
    const openDurationMs = options.openDurationMs ?? DEFAULT_OPEN_DURATION_MS;
    const failureThreshold = options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    const shouldTrip = options.shouldTrip ?? ((error: unknown) => error instanceof TransientProviderError);
    const circuit = this.circuitFor(key);
    const now = Date.now();

    if (circuit.openedUntilMs !== null) {
      const stillOpen = now < circuit.openedUntilMs;
      if (stillOpen || circuit.probeInFlight) {
        const retryAfterSeconds = Math.max(1, Math.ceil(((stillOpen ? circuit.openedUntilMs : now + openDurationMs) - now) / 1000));
        throw new CircuitOpenError(`Circuito aberto para "${key}": o provedor falhou ${circuit.consecutiveFailures} vezes seguidas.`, retryAfterSeconds);
      }
      circuit.probeInFlight = true;
    }

    try {
      const result = await operation();
      this.reset(key);
      return result;
    }
    catch (error: unknown) {
      circuit.probeInFlight = false;

      if (!shouldTrip(error)) {
        // Rejeição de negócio, configuração inválida, resposta que não entendemos: o provedor está
        // de pé e respondendo. Abrir o circuito aqui pararia a emissão por causa de uma nota ruim.
        circuit.consecutiveFailures = 0;
        circuit.openedUntilMs = null;
        throw error;
      }

      circuit.consecutiveFailures += 1;
      if (circuit.consecutiveFailures >= failureThreshold) {
        circuit.openedUntilMs = Date.now() + openDurationMs;
      }
      throw error;
    }
  }

  /** Estado atual, para diagnóstico e métricas. */
  public static isOpen(key: string): boolean {
    const circuit = this.circuits.get(key);
    return !!circuit?.openedUntilMs && Date.now() < circuit.openedUntilMs;
  }

  public static reset(key?: string): void {
    if (key === undefined) {
      this.circuits.clear();
      return;
    }
    this.circuits.delete(key);
  }

  private static circuitFor(key: string): CircuitState {
    const existing = this.circuits.get(key);
    if (existing) {
      return existing;
    }

    const created: CircuitState = { consecutiveFailures: 0, openedUntilMs: null, probeInFlight: false };
    this.circuits.set(key, created);
    return created;
  }
}
