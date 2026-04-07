import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { CaslAbilityFactory } from 'src/app/authentication/application/authorization/casl-ability.factory';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { REQUIRED_CLAIMS_KEY } from 'src/app/authentication/infra/decorators/authorization-metadata.constants';
import { ClaimsGuard } from './claims.guard';

function httpContext(
  user: Payload | undefined,
  handler: object,
  controllerClass: object,
) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => handler,
    getClass: () => controllerClass,
  };
}

describe('ClaimsGuard', () => {
  let guard: ClaimsGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let createForUser: jest.Mock;

  beforeEach(async() => {
    reflector = { getAllAndOverride: jest.fn() };
    createForUser = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        ClaimsGuard,
        { provide: Reflector, useValue: reflector },
        {
          provide: CaslAbilityFactory,
          useValue: { createForUser },
        },
      ],
    }).compile();

    guard = module.get(ClaimsGuard);
  });

  it('should deny access when no claims metadata is present on the route', async() => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = httpContext(
      { sub: 1, role: AccountRole.ADMIN },
      {},
      {},
    ) as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('should deny access when required claims metadata is an empty array', async() => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = httpContext(
      { sub: 1, role: AccountRole.ADMIN },
      {},
      {},
    ) as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('should deny access with an application error when no authenticated user is on the request', async() => {
    reflector.getAllAndOverride.mockReturnValue([Claim.BANK_LIST]);
    const ctx = httpContext(undefined, {}, {}) as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('should allow access when the user ability satisfies every required claim', async() => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === REQUIRED_CLAIMS_KEY ? [Claim.BANK_LIST] : undefined,
    );
    createForUser.mockResolvedValue({
      can: (action: string, subject: string) => action === 'list' && subject === 'bank',
    });
    const ctx = httpContext(
      { sub: 1, role: AccountRole.ADMIN },
      {},
      {},
    ) as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should deny access when the user is missing one of several required claims', async() => {
    reflector.getAllAndOverride.mockReturnValue([Claim.BANK_LIST, Claim.BANK_CREATE]);
    createForUser.mockResolvedValue({
      can: (action: string, subject: string) => subject === 'bank' && action === 'list',
    });
    const ctx = httpContext(
      { sub: 1, role: AccountRole.ADMIN },
      {},
      {},
    ) as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('should allow access when a required claim string is malformed and cannot be parsed', async() => {
    reflector.getAllAndOverride.mockReturnValue(['not-a-valid-claim']);
    createForUser.mockResolvedValue({ can: () => false });
    const ctx = httpContext(
      { sub: 1, role: AccountRole.ADMIN },
      {},
      {},
    ) as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
