"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const account_status_enum_1 = require("../../../../account/domain/enums/account-status.enum");
const inactive_account_error_1 = require("../../errors/inactive-account.error");
const guards_module_1 = require("../guards.module");
const authentication_guard_1 = require("./authentication.guard");
function contextMockFactory(user, type) {
    return (0, ts_jest_1.createMock)({
        switchToHttp: () => ({
            getRequest: () => ({ user }),
        }),
        switchToWs: () => ({
            getClient: () => ({ user }),
        }),
        getType: () => type,
    });
}
;
describe('AuthenticationGuard', () => {
    let guard;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [guards_module_1.AuthenticationGuardsModule],
        }).compile();
        guard = module.get(authentication_guard_1.AuthenticationGuard);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe.each([
        'http',
        'ws',
    ])('%s case', (type) => {
        it('should be defined', () => {
            expect(guard).toBeDefined();
        });
        it('should return false when request user is not defined', async () => {
            const user = null;
            const context = contextMockFactory(user, type);
            const getAccountMock = jest.spyOn(authentication_guard_1.AuthenticationGuard.prototype, 'getAccount');
            const result = await guard.canActivate(context);
            expect(result).toBe(false);
            expect(getAccountMock).not.toHaveBeenCalled();
        });
        it('should return false when request user is null', async () => {
            const user = { sub: null };
            const context = contextMockFactory(user, type);
            const getAccountMock = jest.spyOn(authentication_guard_1.AuthenticationGuard.prototype, 'getAccount');
            const result = await guard.canActivate(context);
            expect(result).toBe(false);
            expect(getAccountMock).not.toHaveBeenCalled();
        });
        it('should return false when account is not found', async () => {
            const user = (0, ts_jest_1.createMock)({ sub: '123' });
            const context = contextMockFactory(user, type);
            const getAccountMock = jest.spyOn(authentication_guard_1.AuthenticationGuard.prototype, 'getAccount').mockResolvedValue(null);
            const result = await guard.canActivate(context);
            expect(result).toBe(false);
            expect(getAccountMock).toHaveBeenCalledWith(user.sub);
        });
        it('should throw an error when account is inactive', async () => {
            const user = (0, ts_jest_1.createMock)({ sub: '123' });
            const context = contextMockFactory(user, type);
            const account = (0, ts_jest_1.createMock)({ status: account_status_enum_1.AccountStatus.INACTIVE });
            jest.spyOn(authentication_guard_1.AuthenticationGuard.prototype, 'getAccount').mockResolvedValue(account);
            expect.assertions(1);
            return guard.canActivate(context).catch((error) => {
                expect(error).toBeInstanceOf(inactive_account_error_1.InactiveAccountError);
            });
        });
        it('should return true when account is active', async () => {
            const user = (0, ts_jest_1.createMock)({ sub: '123' });
            const context = contextMockFactory(user, type);
            const account = (0, ts_jest_1.createMock)({ status: account_status_enum_1.AccountStatus.ACTIVE });
            jest.spyOn(authentication_guard_1.AuthenticationGuard.prototype, 'getAccount').mockResolvedValue(account);
            const result = await guard.canActivate(context);
            expect(result).toBe(true);
        });
        it('should get account from cache if available', async () => {
            const user = (0, ts_jest_1.createMock)({ sub: '123' });
            const context = contextMockFactory(user, type);
            const account = (0, ts_jest_1.createMock)({ status: account_status_enum_1.AccountStatus.ACTIVE });
            const cacheSetSpy = jest.spyOn(guard['cacheGateway'], 'set');
            const cacheGetSpy = jest.spyOn(guard['cacheGateway'], 'get').mockResolvedValue(account);
            const findAccountByIdSpy = jest.spyOn(guard['findAccountByIdService'], 'execute').mockResolvedValue(null);
            await guard.canActivate(context);
            expect(cacheGetSpy).toHaveBeenCalledWith(`cache:global:account:detail:${user.sub}`);
            expect(findAccountByIdSpy).not.toHaveBeenCalled();
            expect(cacheSetSpy).not.toHaveBeenCalled();
        });
        it('should get account from database if not in cache', async () => {
            const user = (0, ts_jest_1.createMock)({ sub: '123' });
            const context = contextMockFactory(user, type);
            const cacheKey = `cache:global:account:detail:${user.sub}`;
            const account = (0, ts_jest_1.createMock)({ status: account_status_enum_1.AccountStatus.ACTIVE });
            const cacheSetSpy = jest.spyOn(guard['cacheGateway'], 'set');
            const cacheGetSpy = jest.spyOn(guard['cacheGateway'], 'get').mockResolvedValue(null);
            const findAccountByIdSpy = jest.spyOn(guard['findAccountByIdService'], 'execute').mockResolvedValue(account);
            await guard.canActivate(context);
            expect(cacheGetSpy).toHaveBeenCalledWith(cacheKey);
            expect(findAccountByIdSpy).toHaveBeenCalledWith(user.sub);
            expect(cacheSetSpy).toHaveBeenCalledWith(cacheKey, account, 30, true);
        });
    });
});
//# sourceMappingURL=authentication.guard.spec.js.map