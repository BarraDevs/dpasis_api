"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEmailError = void 0;
class InvalidEmailError extends Error {
    constructor() {
        super('E-mail inválido');
        this.name = 'InvalidEmailError';
    }
}
exports.InvalidEmailError = InvalidEmailError;
//# sourceMappingURL=email.error.js.map