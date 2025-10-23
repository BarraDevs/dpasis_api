import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RedisClientType } from 'redis';
import { ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { CacheRedisAdapterGateway } from './cache-redis.gateway';

describe('CacheRedisAdapterGateway', () => {
  let sut: CacheRedisAdapterGateway;
  let mockRedisClient: DeepMocked<RedisClientType>;
  let mockLogger: DeepMocked<ILoggerGateway>;

  beforeEach(() => {
    mockRedisClient = createMock<RedisClientType>({
      set: jest.fn(),
      expire: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
    });
    mockLogger = createMock<ILoggerGateway>();
    sut = new CacheRedisAdapterGateway(mockRedisClient, mockLogger);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('set', () => {
    it('should set a value in the cache with ttl', async() => {
      // Arrange
      const key = 'testKey';
      const value = { test: 'value' };
      const ttlInSeconds = 60;

      // Act
      await sut.set(key, value, ttlInSeconds);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, ttlInSeconds);
    });

    it('should set a value in the cache without ttl', async() => {
      // Arrange
      const key = 'testKey';
      const value = { test: 'value' };

      // Act
      await sut.set(key, value);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, sut['ONE_DAY_IN_SECONDS']);
    });

    it('should log debug information', async() => {
      // Arrange
      const key = 'testKey';
      const value = { test: 'value' };
      const ttlInSeconds = 60;

      // Act
      await sut.set(key, value, ttlInSeconds);

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'set',
        key,
        value,
        ttlInSeconds,
      });
    });

    it('should skip log debug information', async() => {
      // Arrange
      const key = 'testKey';
      const value = { test: 'value' };
      const ttlInSeconds = 60;

      // Act
      await sut.set(key, value, ttlInSeconds, true);

      // Assert
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should log error information on failure', async() => {
      // Arrange
      const key = 'testKey';
      const value = { test: 'value' };
      const ttlInSeconds = 60;
      jest.spyOn(mockRedisClient, 'set').mockRejectedValue(new Error());

      // Act & Assert
      return sut.set(key, value, ttlInSeconds).catch((error) => {
        expect(mockLogger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'set',
          key,
          value,
          ttlInSeconds,
          error,
        });
      });
    });
  });

  describe('get', () => {
    it('should return the value from cache if exists', async() => {
      // Arrange
      const key = 'testKey';
      const value = { test: 'value' };
      jest.spyOn(mockRedisClient, 'get').mockResolvedValue(JSON.stringify(value));

      // Act
      const result = await sut.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should return null when the key does not exist', async() => {
      // Arrange
      const key = 'testKey';
      jest.spyOn(mockRedisClient, 'get').mockResolvedValue(null);

      // Act
      const result = await sut.get(key);

      // Assert
      expect(result).toBeNull();
    });

    it('should log error information on failure', async() => {
      // Arrange
      const key = 'testKey';
      jest.spyOn(mockRedisClient, 'get').mockRejectedValue(new Error());

      // Act & Assert
      return sut.get(key).catch((error) => {
        expect(mockLogger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'get',
          key,
          error,
        });
      });
    });
  });

  describe('delete', () => {
    it('should delete the key from cache', async() => {
      // Arrange
      const key = 'testKey';

      // Act
      await sut.delete(key);

      // Assert
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });

    it('should log debug information', async() => {
      // Arrange
      const key = 'testKey';

      // Act
      await sut.delete(key);

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(LogContext.CACHE, {
        adapter: 'redis',
        action: 'delete',
        key,
      });
    });

    it('should log error information on failure', async() => {
      // Arrange
      const key = 'testKey';
      jest.spyOn(mockRedisClient, 'del').mockRejectedValue(new Error());

      // Act & Assert
      return sut.delete(key).catch((error) => {
        expect(mockLogger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'delete',
          key,
          error,
        });
      });
    });
  });

  describe('deleteContaining', () => {
    it('should delete keys containing the specified pattern', async() => {
      // Arrange
      const key = 'testKey';
      const keysToDelete = ['testKey1', 'testKey2'];
      jest.spyOn(mockRedisClient, 'scan').mockResolvedValue({ cursor: 0, keys: keysToDelete });

      // Act
      await sut.deleteContaining(key);

      // Assert
      expect(mockRedisClient.scan).toHaveBeenCalledWith(0, { MATCH: `*${key}*`, COUNT: 100 });
      expect(mockRedisClient.del).toHaveBeenCalledWith(keysToDelete);
    });

    it('should log error information on failure', async() => {
      // Arrange
      const key = 'testKey';
      jest.spyOn(mockRedisClient, 'scan').mockRejectedValue(new Error());

      // Act & Assert
      return sut.deleteContaining(key).catch((error) => {
        expect(mockLogger.error).toHaveBeenCalledWith(LogContext.CACHE, {
          adapter: 'redis',
          action: 'deleteContaining',
          key,
          error,
        });
      });
    });
  });
});
