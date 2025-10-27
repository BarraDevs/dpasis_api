"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientDuplicateIeError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class ClientDuplicateIeError extends app_exception_1.AppException {
    constructor() {
        super('IE já cadastrado. Tente novamente com outro IE.', 409);
        this.name = 'ClientDuplicateIeError';
    }
}
exports.ClientDuplicateIeError = ClientDuplicateIeError;
//# sourceMappingURL=duplicate-ie.error.js.map