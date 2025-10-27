"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggerModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("../../core/config/config.module");
const config_service_1 = require("../../core/config/config.service");
const token_1 = require("../../core/di/token");
const logger_fake_gateway_1 = require("./adapters/fake/logger-fake.gateway");
const logger_winston_gateway_1 = require("./adapters/winston/logger-winston.gateway");
let LoggerModule = LoggerModule_1 = class LoggerModule {
    static forRoot() {
        return {
            module: LoggerModule_1,
            imports: [config_module_1.ConfigModule],
            providers: [
                {
                    provide: token_1.TOKENS.LoggerGateway,
                    inject: [config_service_1.ConfigService],
                    useFactory: (configService) => {
                        return configService.isTest
                            ? new logger_fake_gateway_1.LoggerFakeAdapterGateway()
                            : new logger_winston_gateway_1.LoggerWinstonAdapterGateway();
                    },
                },
            ],
            exports: [
                token_1.TOKENS.LoggerGateway,
            ],
        };
    }
};
exports.LoggerModule = LoggerModule;
exports.LoggerModule = LoggerModule = LoggerModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], LoggerModule);
//# sourceMappingURL=logger.module.js.map