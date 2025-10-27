"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidAccountRolesError = exports.InvalidAccountStatusError = void 0;
class InvalidAccountStatusError extends Error {
    constructor(status) {
        super(`Status inválido - ${status}`);
        this.name = 'InvalidAccountStatusError';
    }
}
exports.InvalidAccountStatusError = InvalidAccountStatusError;
class InvalidAccountRolesError extends Error {
    constructor(roles) {
        super(`Roles inválidos - ${roles.join(', ')}`);
        this.name = 'InvalidAccountRolesError';
    }
}
exports.InvalidAccountRolesError = InvalidAccountRolesError;
//# sourceMappingURL=account.error.js.map