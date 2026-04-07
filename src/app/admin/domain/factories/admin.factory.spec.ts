import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { InvalidAdminClaimsError } from '../errors/invalid-admin-claims.error';
import { AdminFactory } from './admin.factory';

describe('AdminFactory', () => {
  describe('create', () => {
    it('should map valid subject/action pairs to ClaimValue on the entity', () => {
      const admin = AdminFactory.create({
        document: '529.982.247-25',
        name: 'Maria',
        email: 'maria@test.com',
        profilePicture: null,
        claims: [{ subject: Claim.BANK_LIST.subject, action: Claim.BANK_LIST.action }],
      });

      expect(admin.props.claims).toEqual([Claim.BANK_LIST]);
    });

    it('should throw InvalidAdminClaimsError when pair is unknown', () => {
      expect(() =>
        AdminFactory.create({
          document: '529.982.247-25',
          name: 'Maria',
          email: 'maria@test.com',
          profilePicture: null,
          claims: [{ subject: 'unknown', action: 'unknown' }],
        }),
      ).toThrow(InvalidAdminClaimsError);
    });

    it('should create admin with ACTIVE status and accountId 0', () => {
      const admin = AdminFactory.create({
        document: '529.982.247-25',
        name: 'Maria',
        email: 'maria@test.com',
        profilePicture: null,
        claims: [Claim.COMPANY_LIST].map(c => ({ subject: c.subject, action: c.action })),
      });

      expect(admin.props.accountId).toBe(0);
      expect(admin.props.status).toBe(AccountStatus.ACTIVE);
      expect(admin.props.document).toBe('52998224725');
    });
  });
});
