"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenAccountError = void 0;
const app_exception_1 = require("../../../../core/filters/app.exception");
class ForbiddenAccountError extends app_exception_1.AppException {
    constructor() {
        super('Acesso negado.', 403);
        this.name = 'ForbiddenAccountError';
    }
}
exports.ForbiddenAccountError = ForbiddenAccountError;
//# sourceMappingURL=forbidden-account.error.js.map