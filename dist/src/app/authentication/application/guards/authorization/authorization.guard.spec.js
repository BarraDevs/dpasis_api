"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const account_role_enum_1 = require("../../../../account/domain/enums/account-role.enum");
const guards_module_1 = require("../guards.module");
const authorization_guard_1 = require("./authorization.guard");
function contextMockFactory(user) {
    return (0, ts_jest_1.createMock)({
        switchToHttp: () => ({
            getRequest: () => ({ user }),
        }),
    });
}
;
describe('AuthorizationGuard', () => {
    let guard;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [guards_module_1.AuthenticationGuardsModule],
        }).compile();
        guard = module.get(authorization_guard_1.AuthorizationGuard);
    });
    it('should be defined', () => {
        expect(guard).toBeDefined();
    });
    it('should return false when request user is not defined', async () => {
        const user = null;
        const context = contextMockFactory(user);
        const reflectMock = jest.spyOn(guard['reflector'], 'getAllAndOverride');
        const result = await guard.canActivate(context);
        expect(result).toBe(false);
        expect(reflectMock).not.toHaveBeenCalled();
    });
    it('should return false when request user does not have role', async () => {
        const user = { role: null };
        const context = contextMockFactory(user);
        const reflectMock = jest.spyOn(guard['reflector'], 'getAllAndOverride');
        const result = await guard.canActivate(context);
        expect(result).toBe(false);
        expect(reflectMock).not.toHaveBeenCalled();
    });
    it('should return true when required roles are not defined', async () => {
        const context = (0, ts_jest_1.createMock)();
        jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue([]);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });
    it('should return true when user has required role', async () => {
        const requiredRoles = [account_role_enum_1.AccountRole.ADMIN, account_role_enum_1.AccountRole.STORE];
        const user = (0, ts_jest_1.createMock)({ roles: [account_role_enum_1.AccountRole.STORE] });
        const context = contextMockFactory(user);
        jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(requiredRoles);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });
    it('should return false when user does not have required role', async () => {
        const requiredRoles = [account_role_enum_1.AccountRole.ADMIN, account_role_enum_1.AccountRole.STORE];
        const user = (0, ts_jest_1.createMock)({ roles: [account_role_enum_1.AccountRole.USER] });
        const context = contextMockFactory(user);
        jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(requiredRoles);
        const result = await guard.canActivate(context);
        expect(result).toBe(false);
    });
});
//# sourceMappingURL=authorization.guard.spec.js.map