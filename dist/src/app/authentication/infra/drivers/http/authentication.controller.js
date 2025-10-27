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
exports.AuthenticationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const signin_with_credential_and_password_dto_1 = require("../../../application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto");
const signin_with_credential_and_password_service_1 = require("../../../application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service");
const swagger_1 = require("../../../../../infra/openapi/swagger");
let AuthenticationController = class AuthenticationController {
    signInWithCredentialAndPassword;
    constructor(signInWithCredentialAndPassword) {
        this.signInWithCredentialAndPassword = signInWithCredentialAndPassword;
    }
    async signInWithCredential(body) {
        return this.signInWithCredentialAndPassword.execute(body);
    }
};
exports.AuthenticationController = AuthenticationController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.Swagger)({
        tags: ['Autenticação'],
        summary: 'Login com email e senha',
        applyBadRequest: true,
        applyForbidden: true,
        okResponse: signin_with_credential_and_password_dto_1.SigninWithCredentialAndPasswordOutputDto,
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("../../../application/usecases/signin-with-credential-and-password/dtos/signin-with-credential-and-password.dto").SigninWithCredentialAndPasswordOutputDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signin_with_credential_and_password_dto_1.SigninWithCredentialAndPasswordInputDto]),
    __metadata("design:returntype", Promise)
], AuthenticationController.prototype, "signInWithCredential", null);
exports.AuthenticationController = AuthenticationController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [signin_with_credential_and_password_service_1.SignInWithCredentialAndPassword])
], AuthenticationController);
//# sourceMappingURL=authentication.controller.js.map