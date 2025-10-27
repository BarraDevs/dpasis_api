"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCredentialError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class InvalidCredentialError extends app_exception_1.AppException {
    constructor() {
        super('Credenciais inválidas.', 400);
        this.name = 'InvalidCredentialError';
    }
}
exports.InvalidCredentialError = InvalidCredentialError;
//# sourceMappingURL=invalid-credential.error.js.map