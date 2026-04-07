import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { AuthenticationGuardsModule } from '../../application/guards/guards.module';
import { RolesGuard } from './roles.guard';

function contextMockFactory(user: Payload | null) {
  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  });
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
    }).compile();

    guard = module.get(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return false when request user is not defined', async() => {
    const user = null;
    const context = contextMockFactory(user);
    const reflectMock = jest.spyOn(guard['reflector'], 'getAllAndOverride');

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
    expect(reflectMock).not.toHaveBeenCalled();
  });

  it('should return false when request user does not have role', async() => {
    const user = { role: null } as any;
    const context = contextMockFactory(user);
    const reflectMock = jest.spyOn(guard['reflector'], 'getAllAndOverride');

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
    expect(reflectMock).not.toHaveBeenCalled();
  });

  it('should return false when required roles are not defined', async() => {
    const context = createMock<ExecutionContext>();
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue([]);

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return true when user has required role', async() => {
    const requiredRoles = [AccountRole.ADMIN, AccountRole.SELLER];
    const user = createMock<Payload>({ role: AccountRole.SELLER });
    const context = contextMockFactory(user);
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(requiredRoles);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should return false when user does not have required role', async() => {
    const requiredRoles = [AccountRole.ADMIN];
    const user = createMock<Payload>({ role: AccountRole.SELLER });
    const context = contextMockFactory(user);
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(requiredRoles);

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });
});
