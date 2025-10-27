"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressNotFoundError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class AddressNotFoundError extends app_exception_1.AppException {
    constructor() {
        super('Endereço não encontrado na base de dados', 404);
        this.name = 'AddressNotFoundError';
    }
}
exports.AddressNotFoundError = AddressNotFoundError;
//# sourceMappingURL=address-not-found.error.js.map