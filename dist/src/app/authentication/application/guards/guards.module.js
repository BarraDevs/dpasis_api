"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationGuardsModule = void 0;
const common_1 = require("@nestjs/common");
const account_module_1 = require("../../../account/account.module");
const cache_module_1 = require("../../../../infra/cache/cache.module");
const authentication_guard_1 = require("./authentication/authentication.guard");
const authorization_guard_1 = require("./authorization/authorization.guard");
let AuthenticationGuardsModule = class AuthenticationGuardsModule {
};
exports.AuthenticationGuardsModule = AuthenticationGuardsModule;
exports.AuthenticationGuardsModule = AuthenticationGuardsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            account_module_1.AccountModule,
            cache_module_1.CacheModule.forRoot(),
        ],
        providers: [
            authentication_guard_1.AuthenticationGuard,
            authorization_guard_1.AuthorizationGuard,
        ],
        exports: [
            authentication_guard_1.AuthenticationGuard,
            authorization_guard_1.AuthorizationGuard,
            account_module_1.AccountModule,
            cache_module_1.CacheModule,
        ],
    })
], AuthenticationGuardsModule);
//# sourceMappingURL=guards.module.js.map