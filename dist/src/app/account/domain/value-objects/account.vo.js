"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const account_role_enum_1 = require("../enums/account-role.enum");
const account_status_enum_1 = require("../enums/account-status.enum");
const account_error_1 = require("./account.error");
class Account {
    _status;
    _roles;
    constructor(status, roles) {
        this.status = status;
        this.roles = roles;
    }
    set status(status) {
        if (!Object.values(account_status_enum_1.AccountStatus).includes(status)) {
            throw new account_error_1.InvalidAccountStatusError(status);
        }
        this._status = status;
    }
    set roles(roles) {
        const invalidRoles = roles.filter((role) => !Object.values(account_role_enum_1.AccountRole).includes(role));
        if (invalidRoles.length > 0) {
            throw new account_error_1.InvalidAccountRolesError(invalidRoles);
        }
        this._roles = roles;
    }
    get isActive() {
        return this._status === account_status_enum_1.AccountStatus.ACTIVE;
    }
    get isInactive() {
        return this._status === account_status_enum_1.AccountStatus.INACTIVE;
    }
    get isAdmin() {
        return this._roles.includes(account_role_enum_1.AccountRole.ADMIN);
    }
}
exports.Account = Account;
//# sourceMappingURL=account.vo.js.map