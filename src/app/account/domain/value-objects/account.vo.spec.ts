import { AccountRole } from '../enums/account-role.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { InvalidAccountRolesError, InvalidAccountStatusError } from './account.error';
import { Account } from './account.vo';

describe('Account Value Object', () => {
  it('should throw an error if status is invalid', () => {
    // Arrange
    const invalidStatus = 'INVALID_STATUS';

    // Act & Assert
    expect(() => new Account(invalidStatus, [])).toThrow(`Status inválido - ${invalidStatus}`);
    expect(() => new Account(invalidStatus, [])).toThrow(InvalidAccountStatusError);
  });

  it('should throw an error if roles contain invalid values', () => {
    // Arrange
    const invalidRoles = [
      AccountRole.ADMIN,
      'INVALID_ROLE',
      AccountRole.SELLER,
    ];

    // Act & Assert
    expect(() => new Account(AccountStatus.ACTIVE, invalidRoles)).toThrow(`Roles inválidos - ${invalidRoles[1]}`);
    expect(() => new Account(AccountStatus.ACTIVE, invalidRoles)).toThrow(InvalidAccountRolesError);
  });

  it('should correctly identify active and inactive statuses', () => {
    // Arrange
    const activeAccount = new Account(AccountStatus.ACTIVE, []);
    const inactiveAccount = new Account(AccountStatus.INACTIVE, []);

    // Act & Assert
    expect(activeAccount.isActive).toBe(true);
    expect(activeAccount.isInactive).toBe(false);

    expect(inactiveAccount.isActive).toBe(false);
    expect(inactiveAccount.isInactive).toBe(true);
  });

  it('should correctly identify admin role', () => {
    // Arrange
    const adminAccount = new Account(AccountStatus.ACTIVE, [AccountRole.ADMIN, AccountRole.SELLER]);
    const userAccount = new Account(AccountStatus.ACTIVE, [AccountRole.SELLER]);

    // Act & Assert
    expect(adminAccount.isAdmin).toBe(true);
    expect(userAccount.isAdmin).toBe(false);
  });

  it('should create account with valid status and roles', () => {
    // Arrange
    const status = AccountStatus.ACTIVE;
    const roles = [AccountRole.ADMIN, AccountRole.SELLER];

    // Act
    const account = new Account(status, roles);

    // Assert
    expect(account).toBeInstanceOf(Account);
    expect(account.isActive).toBe(true);
    expect(account.isAdmin).toBe(true);
  });
});
