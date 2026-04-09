import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { AdminCannotBeInactiveError } from '../errors/admin-cannot-be-inactive';
import { Admin, AdminProps } from './admin.entity';

function makeAdminProps(overrides?: Partial<AdminProps>): AdminProps {
  return {
    accountId: 1,
    document: '52998224725',
    name: 'Admin',
    email: 'admin@test.com',
    profilePicture: null,
    status: AccountStatus.ACTIVE,
    claims: [Claim.BANK_READ],
    canBeRemoved: true,
    ...overrides,
  };
}

describe('Admin', () => {
  describe('_instantiate', () => {
    it('should create an Admin instance with the provided props', () => {
      const props = makeAdminProps();

      const admin = Admin._instantiate(props);

      expect(admin).toBeInstanceOf(Admin);
    });
  });

  describe('isActive', () => {
    it('should return true when status is ACTIVE', () => {
      const admin = Admin._instantiate(makeAdminProps({ status: AccountStatus.ACTIVE }));

      expect(admin.isActive()).toBe(true);
    });

    it('should return false when status is INACTIVE', () => {
      const admin = Admin._instantiate(makeAdminProps({ status: AccountStatus.INACTIVE }));

      expect(admin.isActive()).toBe(false);
    });
  });

  describe('activate', () => {
    it('should set status to ACTIVE', () => {
      const admin = Admin._instantiate(makeAdminProps({ status: AccountStatus.INACTIVE }));

      admin.activate();

      expect(admin.props.status).toBe(AccountStatus.ACTIVE);
    });

    it('should keep status as ACTIVE when it is already ACTIVE', () => {
      const admin = Admin._instantiate(makeAdminProps({ status: AccountStatus.ACTIVE }));

      admin.activate();

      expect(admin.props.status).toBe(AccountStatus.ACTIVE);
    });
  });

  describe('deactivate', () => {
    it('should set status to INACTIVE', () => {
      const admin = Admin._instantiate(makeAdminProps({ status: AccountStatus.ACTIVE, canBeRemoved: true }));

      admin.deactivate();

      expect(admin.props.status).toBe(AccountStatus.INACTIVE);
    });

    it('should keep status as INACTIVE when it is already INACTIVE', () => {
      const admin = Admin._instantiate(makeAdminProps({ status: AccountStatus.INACTIVE, canBeRemoved: true }));

      admin.deactivate();

      expect(admin.props.status).toBe(AccountStatus.INACTIVE);
    });

    it('should throw AdminCannotBeInactiveError when admin cannot be inactive', () => {
      const admin = Admin._instantiate(makeAdminProps({ status: AccountStatus.ACTIVE, canBeRemoved: false }));

      expect(() => admin.deactivate()).toThrow(AdminCannotBeInactiveError);
    });
  });
});
