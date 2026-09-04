import { createMock } from '@golevelup/ts-jest';
import { createClient } from 'redis';
import { ConfigService } from 'src/core/config/config.service';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { CacheRedisAdapterGateway } from './cache-redis.gateway';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

type FakeRedisClient = {
  isOpen: boolean;
  connect: jest.Mock;
  set: jest.Mock;
  get: jest.Mock;
  del: jest.Mock;
  expire: jest.Mock;
  scan: jest.Mock;
};

function makeRedisClient(overrides: Partial<FakeRedisClient> = {}): FakeRedisClient {
  return {
    isOpen: true,
    connect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    scan: jest.fn().mockResolvedValue({ cursor: '0', keys: [] }),
    ...overrides,
  };
}

async function flushConnect(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('CacheRedisAdapterGateway - Unit tests', () => {
  const redisUrl = 'redis://localhost:6379';
  let sut: CacheRedisAdapterGateway;
  let logger: ILoggerGateway;
  let configService: ConfigService;
  let client: FakeRedisClient;

  async function makeSut(clientOverrides: Partial<FakeRedisClient> = {}): Promise<{
    sut: CacheRedisAdapterGateway;
    client: FakeRedisClient;
  }> {
    client = makeRedisClient(clientOverrides);
    mockedCreateClient.mockReturnValue(client as never);

    logger = createMock<ILoggerGateway>();
    configService = createMock<ConfigService>({
      redisUrl,
      redisCacheDatabase: 0,
    });

    sut = new CacheRedisAdapterGateway(logger, configService);
    await flushConnect();

    return { sut, client };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', async() => {
    // Arrange & Act
    await makeSut();

    // Assert
    expect(sut).toBeDefined();
  });

  describe('connect', () => {
    it('should create client with url and database then connect', async() => {
      // Act
      await makeSut();

      // Assert
      expect(mockedCreateClient).toHaveBeenCalledWith({
        url: redisUrl,
        database: 0,
      });
      expect(client.connect).toHaveBeenCalledTimes(1);
    });

    it('should log connect error and null the client when connect rejects', async() => {
      // Arrange
      const error = new Error('ECONNREFUSED');
      await makeSut({ connect: jest.fn().mockRejectedValue(error) });

      // Assert
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'connect',
        key: redisUrl,
        error,
      });
    });
  });

  describe('set', () => {
    it('should stringify value, expire with given ttl and debug-log', async() => {
      // Arrange
      await makeSut();
      const key = 'user:1';
      const value = { name: 'João' };

      // Act
      await sut.set(key, value, 60);

      // Assert
      expect(client.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(client.expire).toHaveBeenCalledWith(key, 60);
      expect(logger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'set',
        key,
        value,
        ttlInSeconds: 60,
      });
    });

    it('should skip debug log when skipLog is true', async() => {
      // Arrange
      await makeSut();

      // Act
      await sut.set('k', 'v', 60, true);

      // Assert
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it.each([undefined, 0, -1])('should default ttl to 86400 when ttl is %s', async(ttl) => {
      // Arrange
      await makeSut();

      // Act
      await sut.set('k', 'v', ttl as number | undefined);

      // Assert
      expect(client.expire).toHaveBeenCalledWith('k', 86400);
    });

    it('should expire with ttl 1 when ttl is 1', async() => {
      // Arrange
      await makeSut();

      // Act
      await sut.set('k', 'v', 1);

      // Assert
      expect(client.expire).toHaveBeenCalledWith('k', 1);
    });

    it('should log error and not throw when set rejects', async() => {
      // Arrange
      const error = new Error('SET failed');
      await makeSut({ set: jest.fn().mockRejectedValue(error) });

      // Act & Assert
      await expect(sut.set('k', 'v', 30)).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'set',
        key: 'k',
        value: 'v',
        ttlInSeconds: 30,
        error,
      });
    });

    it('should no-op without throw when client is null after failed connect', async() => {
      // Arrange
      await makeSut({ connect: jest.fn().mockRejectedValue(new Error('down')) });
      jest.clearAllMocks();

      // Act & Assert
      await expect(sut.set('k', 'v')).resolves.toBeUndefined();
      expect(client.set).not.toHaveBeenCalled();
    });
  });

  describe('setIfAbsent', () => {
    it('should return true when Redis SET NX returns OK', async() => {
      // Arrange
      await makeSut({ set: jest.fn().mockResolvedValue('OK') });
      const value = { claimed: true };

      // Act
      const result = await sut.setIfAbsent('lock:a', value, 120);

      // Assert
      expect(result).toBe(true);
      expect(client.set).toHaveBeenCalledWith('lock:a', JSON.stringify(value), {
        NX: true,
        EX: 120,
      });
    });

    it('should return false when Redis SET NX misses', async() => {
      // Arrange
      await makeSut({ set: jest.fn().mockResolvedValue(null) });

      // Act
      const result = await sut.setIfAbsent('lock:a', 'v', 60);

      // Assert
      expect(result).toBe(false);
    });

    it('should rethrow and log error when set throws', async() => {
      // Arrange
      const error = new Error('NX failed');
      await makeSut({ set: jest.fn().mockRejectedValue(error) });

      // Act & Assert — falha de trava não pode virar `false`: quem chama precisa distinguir
      // "outro processo já reivindicou" de "não consegui verificar".
      await expect(sut.setIfAbsent('lock:a', 'v', 60)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'setIfAbsent',
        key: 'lock:a',
        value: 'v',
        ttlInSeconds: 60,
        error,
      });
    });

    it('should throw without calling set when client is null after failed connect', async() => {
      // Arrange
      await makeSut({ connect: jest.fn().mockRejectedValue(new Error('down')) });
      jest.clearAllMocks();

      // Act & Assert
      await expect(sut.setIfAbsent('lock:a', 'v', 60)).rejects.toThrow('Cache indisponível');
      expect(client.set).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should parse and return JSON object including UTF-8', async() => {
      // Arrange
      const stored = { name: 'João' };
      await makeSut({ get: jest.fn().mockResolvedValue(JSON.stringify(stored)) });

      // Act
      const result = await sut.get<{ name: string }>('user:1');

      // Assert
      expect(result).toEqual(stored);
      expect(client.get).toHaveBeenCalledWith('user:1');
    });

    it.each([null, undefined])('should return null when Redis miss is %s', async(miss) => {
      // Arrange
      await makeSut({ get: jest.fn().mockResolvedValue(miss) });

      // Act
      const result = await sut.get('missing');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null and log error when stored value is invalid JSON', async() => {
      // Arrange
      await makeSut({ get: jest.fn().mockResolvedValue('not-json{') });

      // Act
      const result = await sut.get('bad');

      // Assert
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        LogContext.CACHE,
        expect.objectContaining({
          adapter: 'redis',
          action: 'get',
          key: 'bad',
        }),
      );
    });

    it('should return null and log error when get throws', async() => {
      // Arrange
      const error = new Error('GET failed');
      await makeSut({ get: jest.fn().mockRejectedValue(error) });

      // Act
      const result = await sut.get('k');

      // Assert
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'get',
        key: 'k',
        error,
      });
    });

    it('should return null without throw when client is null after failed connect', async() => {
      // Arrange
      await makeSut({ connect: jest.fn().mockRejectedValue(new Error('down')) });
      jest.clearAllMocks();

      // Act
      const result = await sut.get('k');

      // Assert
      expect(result).toBeNull();
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should del key and debug-log', async() => {
      // Arrange
      await makeSut();

      // Act
      await sut.delete('user:1');

      // Assert
      expect(client.del).toHaveBeenCalledWith('user:1');
      expect(logger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'delete',
        key: 'user:1',
      });
    });

    it('should log error and not throw when del rejects', async() => {
      // Arrange
      const error = new Error('DEL failed');
      await makeSut({ del: jest.fn().mockRejectedValue(error) });

      // Act & Assert
      await expect(sut.delete('k')).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'delete',
        key: 'k',
        error,
      });
    });

    it('should no-op without throw when client is null after failed connect', async() => {
      // Arrange
      await makeSut({ connect: jest.fn().mockRejectedValue(new Error('down')) });
      jest.clearAllMocks();

      // Act & Assert
      await expect(sut.delete('k')).resolves.toBeUndefined();
      expect(client.del).not.toHaveBeenCalled();
    });
  });

  describe('deleteContaining', () => {
    it('should scan match pattern, del found keys and debug-log keys', async() => {
      // Arrange
      const keys = ['pref:a', 'pref:b'];
      await makeSut({
        scan: jest.fn().mockResolvedValue({ cursor: '0', keys }),
      });

      // Act
      await sut.deleteContaining('pref');

      // Assert
      expect(client.scan).toHaveBeenCalledWith('0', { MATCH: '*pref*', COUNT: 100 });
      expect(client.del).toHaveBeenCalledWith(keys);
      expect(logger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'deleteContaining',
        key: keys,
      });
    });

    it('should not del or debug when SCAN returns no keys', async() => {
      // Arrange
      await makeSut({
        scan: jest.fn().mockResolvedValue({ cursor: '0', keys: [] }),
      });

      // Act
      await sut.deleteContaining('frag');

      // Assert
      expect(client.scan).toHaveBeenCalledTimes(1);
      expect(client.del).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('should paginate SCAN until cursor returns to 0 then del concatenated keys', async() => {
      // Arrange
      const scan = jest
        .fn()
        .mockResolvedValueOnce({ cursor: '1', keys: ['a:1'] })
        .mockResolvedValueOnce({ cursor: '0', keys: ['a:2'] });
      await makeSut({ scan });

      // Act
      await sut.deleteContaining('a:');

      // Assert
      expect(scan).toHaveBeenCalledTimes(2);
      expect(scan).toHaveBeenNthCalledWith(1, '0', { MATCH: '*a:*', COUNT: 100 });
      expect(scan).toHaveBeenNthCalledWith(2, '1', { MATCH: '*a:*', COUNT: 100 });
      expect(client.del).toHaveBeenCalledWith(['a:1', 'a:2']);
    });

    it('should log error and not throw when scan rejects', async() => {
      // Arrange
      const error = new Error('SCAN failed');
      await makeSut({ scan: jest.fn().mockRejectedValue(error) });

      // Act & Assert
      await expect(sut.deleteContaining('frag')).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'deleteContaining',
        key: 'frag',
        error,
      });
    });

    it('should no-op without throw when client is null after failed connect', async() => {
      // Arrange
      await makeSut({ connect: jest.fn().mockRejectedValue(new Error('down')) });
      jest.clearAllMocks();

      // Act & Assert
      await expect(sut.deleteContaining('frag')).resolves.toBeUndefined();
      expect(client.scan).not.toHaveBeenCalled();
      expect(client.del).not.toHaveBeenCalled();
    });
  });
});
