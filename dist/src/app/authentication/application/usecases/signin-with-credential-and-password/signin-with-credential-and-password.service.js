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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignInWithCredentialAndPassword = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const find_account_by_credential_service_1 = require("../../../../account/application/usecases/find-account-by-credential/find-account-by-credential.service");
const account_vo_1 = require("../../../../account/domain/value-objects/account.vo");
const password_vo_1 = require("../../../../../shared/value-objects/password/password.vo");
const forbidden_account_error_1 = require("../../errors/forbidden-account.error");
const inactive_account_error_1 = require("../../errors/inactive-account.error");
const invalid_credential_error_1 = require("../../errors/invalid-credential.error");
let SignInWithCredentialAndPassword = class SignInWithCredentialAndPassword {
    jwtService;
    findAccountByCredential;
    constructor(jwtService, findAccountByCredential) {
        this.jwtService = jwtService;
        this.findAccountByCredential = findAccountByCredential;
    }
    async execute(data) {
        const accountData = await this.findAccountByCredential.execute(data.credential);
        if (!accountData) {
            throw new invalid_credential_error_1.InvalidCredentialError();
        }
        const isValidPassword = password_vo_1.Password.compare(data.password, accountData.password);
        if (!isValidPassword) {
            throw new invalid_credential_error_1.InvalidCredentialError();
        }
        const account = new account_vo_1.Account(accountData.status, accountData.roles);
        if (account.isInactive) {
            throw new inactive_account_error_1.InactiveAccountError();
        }
        if (!account.isActive) {
            throw new forbidden_account_error_1.ForbiddenAccountError();
        }
        const payload = {
            sub: accountData.id,
            roles: accountData.roles,
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken };
    }
};
exports.SignInWithCredentialAndPassword = SignInWithCredentialAndPassword;
exports.SignInWithCredentialAndPassword = SignInWithCredentialAndPassword = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        find_account_by_credential_service_1.FindAccountByCredential])
], SignInWithCredentialAndPassword);
//# sourceMappingURL=signin-with-credential-and-password.service.js.map