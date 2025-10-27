"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressMainCannotBeDeletedError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class AddressMainCannotBeDeletedError extends app_exception_1.AppException {
    constructor() {
        super('Endereço principal não pode ser excluído', 403);
        this.name = 'AddressMainCannotBeDeletedError';
    }
}
exports.AddressMainCannotBeDeletedError = AddressMainCannotBeDeletedError;
//# sourceMappingURL=address-main-cannot-be-deleted.error.js.map