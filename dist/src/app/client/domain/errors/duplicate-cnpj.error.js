"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientDuplicateCnpjError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class ClientDuplicateCnpjError extends app_exception_1.AppException {
    constructor() {
        super('CNPJ já cadastrado. Tente novamente com outro CNPJ.', 409);
        this.name = 'ClientDuplicateCnpjError';
    }
}
exports.ClientDuplicateCnpjError = ClientDuplicateCnpjError;
//# sourceMappingURL=duplicate-cnpj.error.js.map