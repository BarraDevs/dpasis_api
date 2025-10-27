"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheRedisAdapterGateway = void 0;
const common_1 = require("@nestjs/common");
const token_1 = require("../../../../core/di/token");
const redis_module_1 = require("../../redis.module");
const logger_gateway_1 = require("../../../logger/logger.gateway");
let CacheRedisAdapterGateway = class CacheRedisAdapterGateway {
    redisClient;
    logger;
    ONE_DAY_IN_SECONDS = 86400;
    constructor(redisClient, logger) {
        this.redisClient = redisClient;
        this.logger = logger;
    }
    async set(key, value, ttlInSeconds, skipLog = false) {
        try {
            await this.redisClient.set(key, JSON.stringify(value));
            await this.redisClient.expire(key, ttlInSeconds && ttlInSeconds > 0 ? ttlInSeconds : this.ONE_DAY_IN_SECONDS);
            if (skipLog) {
                return;
            }
            this.logger.debug(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'set',
                key,
                value,
                ttlInSeconds,
            });
        }
        catch (error) {
            this.logger.error(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'set',
                key,
                value,
                ttlInSeconds,
                error,
            });
        }
    }
    async get(key) {
        try {
            const value = await this.redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            this.logger.error(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'get',
                key,
                error,
            });
            return null;
        }
    }
    async delete(key) {
        try {
            await this.redisClient.del(key);
            this.logger.debug(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'delete',
                key,
            });
        }
        catch (error) {
            this.logger.error(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'delete',
                key,
                error,
            });
        }
    }
    async deleteContaining(key) {
        try {
            const keys = [];
            let cursor = 0;
            do {
                const result = await this.redisClient.scan(cursor, { MATCH: `*${key}*`, COUNT: 100 });
                cursor = result.cursor;
                keys.push(...result.keys);
            } while (cursor !== 0);
            if (keys.length > 0) {
                await this.redisClient.del(keys);
                this.logger.debug(logger_gateway_1.LogContext.CACHE, {
                    adapter: 'redis',
                    action: 'deleteContaining',
                    key: keys,
                });
            }
        }
        catch (error) {
            this.logger.error(logger_gateway_1.LogContext.CACHE, {
                adapter: 'redis',
                action: 'deleteContaining',
                key,
                error,
            });
        }
    }
};
exports.CacheRedisAdapterGateway = CacheRedisAdapterGateway;
exports.CacheRedisAdapterGateway = CacheRedisAdapterGateway = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __param(1, (0, common_1.Inject)(token_1.TOKENS.LoggerGateway)),
    __metadata("design:paramtypes", [Object, Object])
], CacheRedisAdapterGateway);
//# sourceMappingURL=cache-redis.gateway.js.map