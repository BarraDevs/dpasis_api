import { TransientProviderError } from '../errors/transient-provider.error';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

const KEY = 'giss:maua';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    CircuitBreaker.reset();
    jest.restoreAllMocks();
  });

  async function failTimes(times: number): Promise<void> {
    for (let i = 0; i < times; i += 1) {
      await CircuitBreaker.run(KEY, () => Promise.reject(new TransientProviderError('provedor fora do ar')))
        .catch(() => undefined);
    }
  }

  it('should return the operation result and keep the circuit closed', async() => {
    // Act
    const result = await CircuitBreaker.run(KEY, () => Promise.resolve('ok'));

    // Assert
    expect(result).toBe('ok');
    expect(CircuitBreaker.isOpen(KEY)).toBe(false);
  });

  it('should stay closed while failures are below the threshold', async() => {
    // Act
    await failTimes(4);

    // Assert
    expect(CircuitBreaker.isOpen(KEY)).toBe(false);
  });

  it('should open after the configured number of consecutive transient failures', async() => {
    // Arrange
    await failTimes(5);
    const operation = jest.fn().mockResolvedValue('ok');

    // Act
    const error = await CircuitBreaker.run(KEY, operation).catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(CircuitOpenError);
    expect(operation).not.toHaveBeenCalled();
    expect(CircuitBreaker.isOpen(KEY)).toBe(true);
  });

  it('should tell the caller when to come back', async() => {
    // Arrange
    await failTimes(5);

    // Act
    const error = await CircuitBreaker.run(KEY, () => Promise.resolve('ok')).catch((e: unknown) => e);

    // Assert — o `Retry-After` vira reagendamento do job, sem gastar tentativa.
    expect((error as CircuitOpenError).retryAfterSeconds).toBeGreaterThan(0);
    expect((error as CircuitOpenError).retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('should let a single probe through after the open period and close on success', async() => {
    // Arrange
    const now = Date.now();
    await failTimes(5);
    jest.spyOn(Date, 'now').mockReturnValue(now + 61_000);
    const operation = jest.fn().mockResolvedValue('ok');

    // Act
    const result = await CircuitBreaker.run(KEY, operation);

    // Assert
    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(CircuitBreaker.isOpen(KEY)).toBe(false);
  });

  it('should reopen when the probe fails again', async() => {
    // Arrange
    const now = Date.now();
    await failTimes(5);
    jest.spyOn(Date, 'now').mockReturnValue(now + 61_000);

    // Act
    await CircuitBreaker.run(KEY, () => Promise.reject(new TransientProviderError('ainda fora')))
      .catch(() => undefined);

    // Assert
    expect(CircuitBreaker.isOpen(KEY)).toBe(true);
  });

  it('should not open on errors that mean the provider is up and answering', async() => {
    // Arrange — rejeição de negócio não é indisponibilidade.
    const businessError = new Error('E10: RPS já informado');

    // Act
    for (let i = 0; i < 10; i += 1) {
      await CircuitBreaker.run(KEY, () => Promise.reject(businessError)).catch(() => undefined);
    }

    // Assert
    expect(CircuitBreaker.isOpen(KEY)).toBe(false);
  });

  it('should clear the failure count after a success', async() => {
    // Arrange
    await failTimes(4);

    // Act
    await CircuitBreaker.run(KEY, () => Promise.resolve('ok'));
    await failTimes(4);

    // Assert
    expect(CircuitBreaker.isOpen(KEY)).toBe(false);
  });

  it('should keep circuits independent per key', async() => {
    // Arrange
    await failTimes(5);

    // Act
    const result = await CircuitBreaker.run('giss:santo-andre', () => Promise.resolve('ok'));

    // Assert
    expect(result).toBe('ok');
    expect(CircuitBreaker.isOpen('giss:santo-andre')).toBe(false);
  });
});
