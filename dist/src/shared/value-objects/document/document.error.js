"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidDocumentError = void 0;
class InvalidDocumentError extends Error {
    constructor() {
        super('CPF/CNPJ inválido');
        this.name = 'InvalidDocumentError';
    }
}
exports.InvalidDocumentError = InvalidDocumentError;
//# sourceMappingURL=document.error.js.map