import { Environment } from 'src/core/config/environment.enum';

/**
 * Em teste o BullMQ inteiro fica de fora: as filas viram fakes em memória e nenhum worker sobe, para
 * que a suíte não dependa de Redis.
 *
 * `QUEUE_E2E=true` religa as filas reais dentro do ambiente de teste. É o interruptor do teste
 * ponta a ponta, que precisa atravessar Redis de verdade — e só ele deve usá-lo.
 */
export function isQueueEnabled(): boolean {
  return process.env.NODE_ENV !== Environment.Test || process.env.QUEUE_E2E === 'true';
}
