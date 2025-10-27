"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPhoneError = void 0;
class InvalidPhoneError extends Error {
    constructor() {
        super('Telefone inválido');
        this.name = 'InvalidPhoneError';
    }
}
exports.InvalidPhoneError = InvalidPhoneError;
//# sourceMappingURL=phone.error.js.map