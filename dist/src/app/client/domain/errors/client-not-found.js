"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientNotFoundError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class ClientNotFoundError extends app_exception_1.AppException {
    constructor() {
        super('Cliente não encontrado na base de dados', 404);
        this.name = 'ClientNotFoundError';
    }
}
exports.ClientNotFoundError = ClientNotFoundError;
//# sourceMappingURL=client-not-found.js.map