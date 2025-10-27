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
exports.AuthenticationGuard = void 0;
const common_1 = require("@nestjs/common");
const find_account_by_id_service_1 = require("../../../../account/application/usecases/find-account-by-id/find-account-by-id.service");
const account_vo_1 = require("../../../../account/domain/value-objects/account.vo");
const token_1 = require("../../../../../core/di/token");
const cache_key_builder_1 = require("../../../../../infra/cache/helpers/cache-key/cache-key.builder");
const inactive_account_error_1 = require("../../errors/inactive-account.error");
let AuthenticationGuard = class AuthenticationGuard {
    cacheGateway;
    findAccountByIdService;
    constructor(cacheGateway, findAccountByIdService) {
        this.cacheGateway = cacheGateway;
        this.findAccountByIdService = findAccountByIdService;
    }
    async canActivate(context) {
        const request = context.getType() === 'ws'
            ? context.switchToWs().getClient()
            : context.switchToHttp().getRequest();
        if (!request?.user?.sub) {
            return false;
        }
        const accountData = await this.getAccount(request.user.sub);
        if (!accountData) {
            return false;
        }
        const account = new account_vo_1.Account(accountData.status, accountData.roles);
        if (account.isInactive) {
            throw new inactive_account_error_1.InactiveAccountError();
        }
        return true;
    }
    async getAccount(accountId) {
        const key = new cache_key_builder_1.CacheKeyBuilder()
            .setResource('account')
            .setCommand('detail', accountId)
            .build();
        const cachedAccount = await this.cacheGateway.get(key);
        if (cachedAccount) {
            return cachedAccount;
        }
        const account = await this.findAccountByIdService.execute(accountId);
        if (account) {
            await this.cacheGateway.set(key, account, 30, true);
        }
        return account;
    }
};
exports.AuthenticationGuard = AuthenticationGuard;
exports.AuthenticationGuard = AuthenticationGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(token_1.TOKENS.CacheGateway)),
    __metadata("design:paramtypes", [Object, find_account_by_id_service_1.FindAccountById])
], AuthenticationGuard);
//# sourceMappingURL=authentication.guard.js.map