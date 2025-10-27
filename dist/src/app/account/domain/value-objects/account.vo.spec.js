"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const account_role_enum_1 = require("../enums/account-role.enum");
const account_status_enum_1 = require("../enums/account-status.enum");
const account_error_1 = require("./account.error");
const account_vo_1 = require("./account.vo");
describe('Account Value Object', () => {
    it('should throw an error if status is invalid', () => {
        const invalidStatus = 'INVALID_STATUS';
        expect(() => new account_vo_1.Account(invalidStatus, [])).toThrow(`Status inválido - ${invalidStatus}`);
        expect(() => new account_vo_1.Account(invalidStatus, [])).toThrow(account_error_1.InvalidAccountStatusError);
    });
    it('should throw an error if roles contain invalid values', () => {
        const invalidRoles = [
            account_role_enum_1.AccountRole.ADMIN,
            'INVALID_ROLE',
            account_role_enum_1.AccountRole.USER,
        ];
        expect(() => new account_vo_1.Account(account_status_enum_1.AccountStatus.ACTIVE, invalidRoles)).toThrow(`Roles inválidos - ${invalidRoles[1]}`);
        expect(() => new account_vo_1.Account(account_status_enum_1.AccountStatus.ACTIVE, invalidRoles)).toThrow(account_error_1.InvalidAccountRolesError);
    });
    it('should correctly identify active and inactive statuses', () => {
        const activeAccount = new account_vo_1.Account(account_status_enum_1.AccountStatus.ACTIVE, []);
        const inactiveAccount = new account_vo_1.Account(account_status_enum_1.AccountStatus.INACTIVE, []);
        expect(activeAccount.isActive).toBe(true);
        expect(activeAccount.isInactive).toBe(false);
        expect(inactiveAccount.isActive).toBe(false);
        expect(inactiveAccount.isInactive).toBe(true);
    });
    it('should correctly identify admin role', () => {
        const adminAccount = new account_vo_1.Account(account_status_enum_1.AccountStatus.ACTIVE, [account_role_enum_1.AccountRole.ADMIN, account_role_enum_1.AccountRole.USER]);
        const userAccount = new account_vo_1.Account(account_status_enum_1.AccountStatus.ACTIVE, [account_role_enum_1.AccountRole.USER]);
        expect(adminAccount.isAdmin).toBe(true);
        expect(userAccount.isAdmin).toBe(false);
    });
    it('should create account with valid status and roles', () => {
        const status = account_status_enum_1.AccountStatus.ACTIVE;
        const roles = [account_role_enum_1.AccountRole.ADMIN, account_role_enum_1.AccountRole.USER];
        const account = new account_vo_1.Account(status, roles);
        expect(account).toBeInstanceOf(account_vo_1.Account);
        expect(account.isActive).toBe(true);
        expect(account.isAdmin).toBe(true);
    });
});
//# sourceMappingURL=account.vo.spec.js.map