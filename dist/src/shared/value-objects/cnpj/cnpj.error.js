"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCnpjError = void 0;
class InvalidCnpjError extends Error {
    constructor() {
        super('CNPJ inválido');
        this.name = 'InvalidCnpjError';
    }
}
exports.InvalidCnpjError = InvalidCnpjError;
//# sourceMappingURL=cnpj.error.js.map