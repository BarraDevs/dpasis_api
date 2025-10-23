import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountDto } from 'src/app/account/application/dtos/account.dto';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { AuthenticationGuardsModule } from '../guards.module';
import { AuthenticationGuard } from './authentication.guard';

function contextMockFactory(user: Payload | null, type: 'http' | 'ws'): ExecutionContext {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    switchToWs: () => ({
      getClient: () => ({ user }),
    }),
    getType: () => type,
  });
};

describe('AuthenticationGuard', () => {
  let guard: AuthenticationGuard;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
    }).compile();

    guard = module.get<AuthenticationGuard>(AuthenticationGuard);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe.each([
    'http',
    'ws',
  ])('%s case', (type: any) => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should return false when request user is not defined', async() => {
      // Arrange
      const user = null;
      const context = contextMockFactory(user, type);
      const getAccountMock = jest.spyOn(AuthenticationGuard.prototype as any, 'getAccount');

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(getAccountMock).not.toHaveBeenCalled();
    });

    it('should return false when request user is null', async() => {
      // Arrange
      const user = { sub: null } as any;
      const context = contextMockFactory(user, type);
      const getAccountMock = jest.spyOn(AuthenticationGuard.prototype as any, 'getAccount');

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(getAccountMock).not.toHaveBeenCalled();
    });

    it('should return false when account is not found', async() => {
      // Arrange
      const user = createMock<Payload>({ sub: '123' });
      const context = contextMockFactory(user, type);
      const getAccountMock = jest.spyOn(AuthenticationGuard.prototype as any, 'getAccount').mockResolvedValue(null);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
      expect(getAccountMock).toHaveBeenCalledWith(user.sub);
    });

    it('should throw an error when account is inactive', async() => {
      // Arrange
      const user = createMock<Payload>({ sub: '123' });
      const context = contextMockFactory(user, type);

      const account = createMock<AccountDto>({ status: AccountStatus.INACTIVE });
      jest.spyOn(AuthenticationGuard.prototype as any, 'getAccount').mockResolvedValue(account);

      // Act & Assert
      expect.assertions(1);
      return guard.canActivate(context).catch((error) => {
        expect(error).toBeInstanceOf(InactiveAccountError);
      });
    });

    it('should return true when account is active', async() => {
      // Arrange
      const user = createMock<Payload>({ sub: '123' });
      const context = contextMockFactory(user, type);

      const account = createMock<AccountDto>({ status: AccountStatus.ACTIVE });
      jest.spyOn(AuthenticationGuard.prototype as any, 'getAccount').mockResolvedValue(account);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should get account from cache if available', async() => {
      // Arrange
      const user = createMock<Payload>({ sub: '123' });
      const context = contextMockFactory(user, type);

      const account = createMock<AccountDto>({ status: AccountStatus.ACTIVE });
      const cacheSetSpy = jest.spyOn(guard['cacheGateway'], 'set');
      const cacheGetSpy = jest.spyOn(guard['cacheGateway'], 'get').mockResolvedValue(account);
      const findAccountByIdSpy = jest.spyOn(guard['findAccountByIdService'], 'execute').mockResolvedValue(null);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith(`cache:global:account:detail:${user.sub}`);
      expect(findAccountByIdSpy).not.toHaveBeenCalled();
      expect(cacheSetSpy).not.toHaveBeenCalled();
    });

    it('should get account from database if not in cache', async() => {
      // Arrange
      const user = createMock<Payload>({ sub: '123' });
      const context = contextMockFactory(user, type);
      const cacheKey = `cache:global:account:detail:${user.sub}`;

      const account = createMock<AccountDto>({ status: AccountStatus.ACTIVE });
      const cacheSetSpy = jest.spyOn(guard['cacheGateway'], 'set');
      const cacheGetSpy = jest.spyOn(guard['cacheGateway'], 'get').mockResolvedValue(null);
      const findAccountByIdSpy = jest.spyOn(guard['findAccountByIdService'], 'execute').mockResolvedValue(account);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith(cacheKey);
      expect(findAccountByIdSpy).toHaveBeenCalledWith(user.sub);
      expect(cacheSetSpy).toHaveBeenCalledWith(cacheKey, account, 30, true);
    });
  });
});
