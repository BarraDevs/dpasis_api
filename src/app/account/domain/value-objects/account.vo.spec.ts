import { AccountRole } from '../enums/account-role.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { InvalidAccountRoleError, InvalidAccountStatusError } from './account.error';
import { Account } from './account.vo';

describe('Account Value Object', () => {
  it('should throw an error if role is invalid', () => {
    // Arrange
    const invalidRole = 'INVALID_ROLE';

    // Act & Assert
    expect(() => new Account(invalidRole, AccountStatus.ACTIVE)).toThrow(`Role inválido - ${invalidRole}`);
    expect(() => new Account(invalidRole, AccountStatus.ACTIVE)).toThrow(InvalidAccountRoleError);
  });

  it('should throw an error if status is invalid', () => {
    // Arrange
    const invalidStatus = 'INVALID_STATUS';

    // Act & Assert
    expect(() => new Account(AccountRole.ADMIN, invalidStatus)).toThrow(`Status inválido - ${invalidStatus}`);
    expect(() => new Account(AccountRole.ADMIN, invalidStatus)).toThrow(InvalidAccountStatusError);
  });

  it('should correctly identify active and inactive statuses', () => {
    // Arrange
    const activeAccount = new Account(AccountRole.ADMIN, AccountStatus.ACTIVE);
    const inactiveAccount = new Account(AccountRole.ADMIN, AccountStatus.INACTIVE);

    // Act & Assert
    expect(activeAccount.isActive).toBe(true);
    expect(activeAccount.isInactive).toBe(false);

    expect(inactiveAccount.isActive).toBe(false);
    expect(inactiveAccount.isInactive).toBe(true);
  });

  it('should correctly identify admin role', () => {
    // Arrange
    const adminAccount = new Account(AccountRole.ADMIN, AccountStatus.ACTIVE);
    const userAccount = new Account(AccountRole.SELLER, AccountStatus.ACTIVE);

    // Act & Assert
    expect(adminAccount.isAdmin).toBe(true);
    expect(userAccount.isAdmin).toBe(false);
  });

  it('should correctly identify seller role', () => {
    // Arrange
    const adminAccount = new Account(AccountRole.ADMIN, AccountStatus.ACTIVE);
    const sellerAccount = new Account(AccountRole.SELLER, AccountStatus.ACTIVE);

    // Act & Assert
    expect(adminAccount.isSeller).toBe(false);
    expect(sellerAccount.isSeller).toBe(true);
  });
});
