"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidExpirationTimeError = void 0;
class InvalidExpirationTimeError extends Error {
    constructor() {
        super('Tempo de expiração inválido');
        this.name = 'InvalidExpirationTimeError';
    }
}
exports.InvalidExpirationTimeError = InvalidExpirationTimeError;
//# sourceMappingURL=code.error.js.map