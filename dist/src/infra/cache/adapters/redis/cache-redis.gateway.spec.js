"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const logger_gateway_1 = require("../../../logger/logger.gateway");
const cache_redis_gateway_1 = require("./cache-redis.gateway");
describe('CacheRedisAdapterGateway', () => {
    let sut;
    let mockRedisClient;
    let mockLogger;
    beforeEach(() => {
        mockRedisClient = (0, ts_jest_1.createMock)({
            set: jest.fn(),
            expire: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            scan: jest.fn(),
        });
        mockLogger = (0, ts_jest_1.createMock)();
        sut = new cache_redis_gateway_1.CacheRedisAdapterGateway(mockRedisClient, mockLogger);
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('set', () => {
        it('should set a value in the cache with ttl', async () => {
            const key = 'testKey';
            const value = { test: 'value' };
            const ttlInSeconds = 60;
            await sut.set(key, value, ttlInSeconds);
            expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
            expect(mockRedisClient.expire).toHaveBeenCalledWith(key, ttlInSeconds);
        });
        it('should set a value in the cache without ttl', async () => {
            const key = 'testKey';
            const value = { test: 'value' };
            await sut.set(key, value);
            expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
            expect(mockRedisClient.expire).toHaveBeenCalledWith(key, sut['ONE_DAY_IN_SECONDS']);
        });
        it('should log debug information', async () => {
            const key = 'testKey';
            const value = { test: 'value' };
            const ttlInSeconds = 60;
            await sut.set(key, value, ttlInSeconds);
            expect(mockLogger.debug).toHaveBeenCalledWith(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'set',
                key,
                value,
                ttlInSeconds,
            });
        });
        it('should skip log debug information', async () => {
            const key = 'testKey';
            const value = { test: 'value' };
            const ttlInSeconds = 60;
            await sut.set(key, value, ttlInSeconds, true);
            expect(mockLogger.debug).not.toHaveBeenCalled();
        });
        it('should log error information on failure', async () => {
            const key = 'testKey';
            const value = { test: 'value' };
            const ttlInSeconds = 60;
            jest.spyOn(mockRedisClient, 'set').mockRejectedValue(new Error());
            return sut.set(key, value, ttlInSeconds).catch((error) => {
                expect(mockLogger.error).toHaveBeenCalledWith(logger_gateway_1.LogContext.CACHE, {
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
        it('should return the value from cache if exists', async () => {
            const key = 'testKey';
            const value = { test: 'value' };
            jest.spyOn(mockRedisClient, 'get').mockResolvedValue(JSON.stringify(value));
            const result = await sut.get(key);
            expect(result).toEqual(value);
        });
        it('should return null when the key does not exist', async () => {
            const key = 'testKey';
            jest.spyOn(mockRedisClient, 'get').mockResolvedValue(null);
            const result = await sut.get(key);
            expect(result).toBeNull();
        });
        it('should log error information on failure', async () => {
            const key = 'testKey';
            jest.spyOn(mockRedisClient, 'get').mockRejectedValue(new Error());
            return sut.get(key).catch((error) => {
                expect(mockLogger.error).toHaveBeenCalledWith(logger_gateway_1.LogContext.CACHE, {
                    adapter: 'redis',
                    action: 'get',
                    key,
                    error,
                });
            });
        });
    });
    describe('delete', () => {
        it('should delete the key from cache', async () => {
            const key = 'testKey';
            await sut.delete(key);
            expect(mockRedisClient.del).toHaveBeenCalledWith(key);
        });
        it('should log debug information', async () => {
            const key = 'testKey';
            await sut.delete(key);
            expect(mockLogger.debug).toHaveBeenCalledWith(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'delete',
                key,
            });
        });
        it('should log error information on failure', async () => {
            const key = 'testKey';
            jest.spyOn(mockRedisClient, 'del').mockRejectedValue(new Error());
            return sut.delete(key).catch((error) => {
                expect(mockLogger.error).toHaveBeenCalledWith(logger_gateway_1.LogContext.CACHE, {
                    adapter: 'redis',
                    action: 'delete',
                    key,
                    error,
                });
            });
        });
    });
    describe('deleteContaining', () => {
        it('should delete keys containing the specified pattern', async () => {
            const key = 'testKey';
            const keysToDelete = ['testKey1', 'testKey2'];
            jest.spyOn(mockRedisClient, 'scan').mockResolvedValue({ cursor: 0, keys: keysToDelete });
            await sut.deleteContaining(key);
            expect(mockRedisClient.scan).toHaveBeenCalledWith(0, { MATCH: `*${key}*`, COUNT: 100 });
            expect(mockRedisClient.del).toHaveBeenCalledWith(keysToDelete);
        });
        it('should log error information on failure', async () => {
            const key = 'testKey';
            jest.spyOn(mockRedisClient, 'scan').mockRejectedValue(new Error());
            return sut.deleteContaining(key).catch((error) => {
                expect(mockLogger.error).toHaveBeenCalledWith(logger_gateway_1.LogContext.CACHE, {
                    adapter: 'redis',
                    action: 'deleteContaining',
                    key,
                    error,
                });
            });
        });
    });
});
//# sourceMappingURL=cache-redis.gateway.spec.js.map