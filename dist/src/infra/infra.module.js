"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraModule = void 0;
const common_1 = require("@nestjs/common");
const cache_module_1 = require("./cache/cache.module");
const database_module_1 = require("./database/database.module");
const logger_module_1 = require("./logger/logger.module");
let InfraModule = class InfraModule {
};
exports.InfraModule = InfraModule;
exports.InfraModule = InfraModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            cache_module_1.CacheModule.forRoot(),
            logger_module_1.LoggerModule.forRoot(),
        ],
        exports: [
            database_module_1.DatabaseModule,
            cache_module_1.CacheModule,
            logger_module_1.LoggerModule,
        ],
    })
], InfraModule);
//# sourceMappingURL=infra.module.js.map