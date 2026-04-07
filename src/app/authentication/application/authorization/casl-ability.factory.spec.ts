import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { TOKENS } from 'src/core/di/token';
import { Claim } from '../../domain/authorization/claim';
import { ClaimAction } from '../../domain/authorization/claim-action.enum';
import { ClaimSubject } from '../../domain/authorization/claim-subject.enum';
import { CaslAbilityFactory } from './casl-ability.factory';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;
  let findClaimsByAccountId: jest.Mock;

  beforeEach(async() => {
    findClaimsByAccountId = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        {
          provide: TOKENS.AccountDao,
          useValue: {
            findClaimsByAccountId,
          },
        },
      ],
    }).compile();

    factory = module.get(CaslAbilityFactory);
  });

  describe('dynamic claims for admin role', () => {
    it('should grant admin only the claims returned from the database when the list is non-empty', async() => {
      // arrange: simulate DB returning specific claims
      findClaimsByAccountId.mockResolvedValue([
        Claim.BANK_LIST,
        Claim.BANK_READ,
      ]);
      const ability = await factory.createForUser({ sub: 1, role: AccountRole.ADMIN });

      // All true cases: should be granted ONLY those returned in the DB array
      expect(ability.can(ClaimAction.List, ClaimSubject.Bank)).toBe(true);
      expect(ability.can(ClaimAction.Read, ClaimSubject.Bank)).toBe(true);

      // All else (all other combinations of action/subject) should be false
      const permitted = new Set([
        [ClaimAction.List, ClaimSubject.Bank].join(':'),
        [ClaimAction.Read, ClaimSubject.Bank].join(':'),
      ]);
      for (const subject of Object.values(ClaimSubject)) {
        for (const action of Object.values(ClaimAction)) {
          const key = [action, subject].join(':');
          if (!permitted.has(key)) {
            expect(ability.can(action, subject)).toBe(false);
          }
        }
      }

      expect(findClaimsByAccountId).toHaveBeenCalledWith(1);
    });

    it('should grant admin no claim-based abilities when the database returns zero claims', async() => {
      findClaimsByAccountId.mockResolvedValue([]);

      const ability = await factory.createForUser({ sub: 1, role: AccountRole.ADMIN });

      // Test all possible ClaimAction and ClaimSubject pairs for false (no permission at all)
      const allSubjects = Object.values(ClaimSubject);
      const allActions = Object.values(ClaimAction);

      for (const subject of allSubjects) {
        for (const action of allActions) {
          expect(ability.can(action, subject)).toBe(false);
        }
      }
    });

    it('should reject when loading admin claims from the database fails', async() => {
      findClaimsByAccountId.mockRejectedValue(new Error('db unavailable'));

      await expect(
        factory.createForUser({ sub: 1, role: AccountRole.ADMIN }),
      ).rejects.toThrow('db unavailable');
    });
  });

  describe('static claims for non-admin roles', () => {
    it('should grant seller no abilities when STATIC_CLAIMS for seller is empty', async() => {
      const ability = await factory.createForUser({ sub: 2, role: AccountRole.SELLER });

      expect(ability.can(ClaimAction.List, ClaimSubject.Bank)).toBe(false);
      expect(findClaimsByAccountId).not.toHaveBeenCalled();
    });

    it('should produce independent abilities for different users', async() => {
      findClaimsByAccountId.mockResolvedValueOnce([Claim.BANK_LIST]);
      findClaimsByAccountId.mockResolvedValueOnce([Claim.CLIENT_LIST]);

      const adminA = await factory.createForUser({ sub: 1, role: AccountRole.ADMIN });
      const adminB = await factory.createForUser({ sub: 2, role: AccountRole.ADMIN });

      expect(adminA.can(ClaimAction.List, ClaimSubject.Bank)).toBe(true);
      expect(adminB.can(ClaimAction.List, ClaimSubject.Bank)).toBe(false);
      expect(adminB.can(ClaimAction.List, ClaimSubject.Client)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should produce a defined ability object for every known AccountRole value', async() => {
      findClaimsByAccountId.mockResolvedValue([]);

      for (const role of Object.values(AccountRole)) {
        const payload: Payload = { sub: 1, role };
        const ability = await factory.createForUser(payload);
        expect(ability).toBeDefined();
      }
    });
  });
});
