import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { ALL_CLAIM_VALUES, Claim } from 'src/app/authentication/domain/authorization/claim';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { TOKENS } from 'src/core/di/token';
import { CaslAbilityFactory } from './casl-ability.factory';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;
  let findClaimStringsByAccountId: jest.Mock;

  beforeEach(async() => {
    findClaimStringsByAccountId = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        {
          provide: TOKENS.AccountDao,
          useValue: {
            findClaimStringsByAccountId,
          },
        },
      ],
    }).compile();

    factory = module.get(CaslAbilityFactory);
  });

  describe('dynamic claims for admin role', () => {
    it('should grant admin only the claims returned from the database when the list is non-empty', async() => {
      findClaimStringsByAccountId.mockResolvedValue([Claim.BANK_LIST, Claim.BANK_READ]);

      const ability = await factory.createForUser({ sub: 1, role: AccountRole.ADMIN });

      expect(ability.can('list', 'bank')).toBe(true);
      expect(ability.can('read', 'bank')).toBe(true);
      expect(ability.can('create', 'bank')).toBe(false);
      expect(findClaimStringsByAccountId).toHaveBeenCalledWith(1);
    });

    it('should grant admin the full catalog when the database returns zero claims', async() => {
      findClaimStringsByAccountId.mockResolvedValue([]);

      const ability = await factory.createForUser({ sub: 1, role: AccountRole.ADMIN });

      expect(ability.can('create', 'bank')).toBe(true);
      expect(ALL_CLAIM_VALUES.length).toBeGreaterThan(0);
    });

    it('should reject when loading admin claims from the database fails', async() => {
      findClaimStringsByAccountId.mockRejectedValue(new Error('db unavailable'));

      await expect(
        factory.createForUser({ sub: 1, role: AccountRole.ADMIN }),
      ).rejects.toThrow('db unavailable');
    });

    it('should ignore malformed claim strings from the database when building the ability', async() => {
      findClaimStringsByAccountId.mockResolvedValue([
        'invalid',
        '',
        'bank::',
        Claim.BANK_LIST,
      ]);

      const ability = await factory.createForUser({ sub: 1, role: AccountRole.ADMIN });

      expect(ability.can('list', 'bank')).toBe(true);
    });
  });

  describe('static claims for non-admin roles', () => {
    it('should grant seller no abilities when STATIC_CLAIMS for seller is empty', async() => {
      const ability = await factory.createForUser({ sub: 2, role: AccountRole.SELLER });

      expect(ability.can('list', 'bank')).toBe(false);
      expect(findClaimStringsByAccountId).not.toHaveBeenCalled();
    });

    it('should produce independent abilities for different users', async() => {
      findClaimStringsByAccountId.mockResolvedValueOnce([Claim.BANK_LIST]);
      findClaimStringsByAccountId.mockResolvedValueOnce([Claim.CLIENT_LIST]);

      const adminA = await factory.createForUser({ sub: 1, role: AccountRole.ADMIN });
      const adminB = await factory.createForUser({ sub: 2, role: AccountRole.ADMIN });

      expect(adminA.can('list', 'bank')).toBe(true);
      expect(adminB.can('list', 'bank')).toBe(false);
      expect(adminB.can('list', 'client')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should produce a defined ability object for every known AccountRole value', async() => {
      findClaimStringsByAccountId.mockResolvedValue([]);

      for (const role of Object.values(AccountRole)) {
        const payload: Payload = { sub: 1, role };
        const ability = await factory.createForUser(payload);
        expect(ability).toBeDefined();
      }
    });
  });
});
