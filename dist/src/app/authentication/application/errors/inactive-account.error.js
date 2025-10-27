"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InactiveAccountError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class InactiveAccountError extends app_exception_1.AppException {
    constructor() {
        super('A sua conta foi suspensa. Entre em contato com a administração para mais detalhes.', 403);
        this.name = 'InactiveAccountError';
    }
}
exports.InactiveAccountError = InactiveAccountError;
//# sourceMappingURL=inactive-account.error.js.map