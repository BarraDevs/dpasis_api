"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressMainMustBeOneError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class AddressMainMustBeOneError extends app_exception_1.AppException {
    constructor() {
        super('Deve existir um e apenas um endereço principal', 403);
        this.name = 'AddressMainMustBeOneError';
    }
}
exports.AddressMainMustBeOneError = AddressMainMustBeOneError;
//# sourceMappingURL=address-main-must-be-one.error.js.map