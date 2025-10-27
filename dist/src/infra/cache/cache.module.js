"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CacheModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const common_1 = require("@nestjs/common");
const environment_enum_1 = require("../../core/config/environment.enum");
const token_1 = require("../../core/di/token");
const logger_module_1 = require("../logger/logger.module");
const cache_fake_gateway_1 = require("./adapters/fake/cache-fake.gateway");
const cache_redis_gateway_1 = require("./adapters/redis/cache-redis.gateway");
const redis_module_1 = require("./redis.module");
let CacheModule = CacheModule_1 = class CacheModule {
    static forRoot() {
        const isTest = process.env.NODE_ENV === environment_enum_1.Environment.Test;
        const adapter = {
            provide: token_1.TOKENS.CacheGateway,
            useClass: isTest ? cache_fake_gateway_1.CacheFakeAdapterGateway : cache_redis_gateway_1.CacheRedisAdapterGateway,
        };
        return {
            module: CacheModule_1,
            imports: isTest ? [] : [redis_module_1.RedisModule, logger_module_1.LoggerModule.forRoot()],
            providers: [adapter],
            exports: [adapter],
        };
    }
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = CacheModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], CacheModule);
//# sourceMappingURL=cache.module.js.map