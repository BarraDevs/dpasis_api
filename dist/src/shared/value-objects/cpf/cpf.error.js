"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCpfError = void 0;
class InvalidCpfError extends Error {
    constructor() {
        super('CPF inválido');
        this.name = 'InvalidCpfError';
    }
}
exports.InvalidCpfError = InvalidCpfError;
//# sourceMappingURL=cpf.error.js.map