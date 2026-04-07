import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { CaslAbilityFactory } from 'src/app/authentication/application/authorization/casl-ability.factory';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ClaimsGuard } from './claims.guard';

/**
 * Cenários de segurança transversais ao CASL (comportamento atual dos guards).
 */
describe('Authorization security scenarios', () => {
  let claimsGuard: ClaimsGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let createForUser: jest.Mock;

  beforeEach(async() => {
    reflector = { getAllAndOverride: jest.fn() };
    createForUser = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        ClaimsGuard,
        { provide: Reflector, useValue: reflector },
        { provide: CaslAbilityFactory, useValue: { createForUser } },
      ],
    }).compile();

    claimsGuard = module.get(ClaimsGuard);
  });

  it('should deny access when the user role is admin but CASL denies the required claim', async() => {
    reflector.getAllAndOverride.mockReturnValue([Claim.BANK_CREATE]);
    createForUser.mockResolvedValue({ can: () => false });
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { sub: 1, role: AccountRole.ADMIN } as Payload }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    await expect(claimsGuard.canActivate(ctx)).resolves.toBe(false);
  });
});
