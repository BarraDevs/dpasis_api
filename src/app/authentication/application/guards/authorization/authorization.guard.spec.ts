import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { AuthenticationGuardsModule } from '../guards.module';
import { AuthorizationGuard } from './authorization.guard';

function contextMockFactory(user: Payload | null) {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  });
};

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
    }).compile();

    guard = module.get(AuthorizationGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return false when request user is not defined', async() => {
    // Arrange
    const user = null;
    const context = contextMockFactory(user);
    const reflectMock = jest.spyOn(guard['reflector'], 'getAllAndOverride');

    // Act
    const result = await guard.canActivate(context);

    // Assert
    expect(result).toBe(false);
    expect(reflectMock).not.toHaveBeenCalled();
  });

  it('should return false when request user does not have role', async() => {
    // Arrange
    const user = { role: null } as any;
    const context = contextMockFactory(user);
    const reflectMock = jest.spyOn(guard['reflector'], 'getAllAndOverride');

    // Act
    const result = await guard.canActivate(context);

    // Assert
    expect(result).toBe(false);
    expect(reflectMock).not.toHaveBeenCalled();
  });

  it('should return true when required roles are not defined', async() => {
    // Arrange
    const context = createMock<ExecutionContext>();
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue([]);

    // Act
    const result = await guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });

  it('should return true when user has required role', async() => {
    // Arrange
    const requiredRoles = [AccountRole.ADMIN, AccountRole.SELLER];
    const user = createMock<Payload>({ roles: [AccountRole.SELLER] });
    const context = contextMockFactory(user);
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(requiredRoles);

    // Act
    const result = await guard.canActivate(context);

    // Assert
    expect(result).toBe(true);
  });

  it('should return false when user does not have required role', async() => {
    // Arrange
    const requiredRoles = [AccountRole.ADMIN];
    const user = createMock<Payload>({ roles: [AccountRole.SELLER] });
    const context = contextMockFactory(user);
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(requiredRoles);

    // Act
    const result = await guard.canActivate(context);

    // Assert
    expect(result).toBe(false);
  });
});
