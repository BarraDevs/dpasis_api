"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const account_module_1 = require("../account/account.module");
const guards_module_1 = require("./application/guards/guards.module");
const signin_with_credential_and_password_service_1 = require("./application/usecases/signin-with-credential-and-password/signin-with-credential-and-password.service");
const authentication_controller_1 = require("./infra/drivers/http/authentication.controller");
const jwt_module_1 = require("./infra/strategies/jwt/jwt.module");
let AuthenticationModule = class AuthenticationModule {
};
exports.AuthenticationModule = AuthenticationModule;
exports.AuthenticationModule = AuthenticationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_module_1.JwtAuthModule,
            passport_1.PassportModule,
            account_module_1.AccountModule,
            guards_module_1.AuthenticationGuardsModule,
        ],
        controllers: [
            authentication_controller_1.AuthenticationController,
        ],
        providers: [
            signin_with_credential_and_password_service_1.SignInWithCredentialAndPassword,
        ],
    })
], AuthenticationModule);
//# sourceMappingURL=authentication.module.js.map