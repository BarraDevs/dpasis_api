import { Password } from './password.vo';

describe('Password Value Object', () => {
  it('should create a new hashed password', () => {
    // Arrange
    const rawPassword = 'T0I2%kBmZez7';

    // Act
    const newPassword = new Password(rawPassword);

    // Assert
    expect(newPassword).toBeDefined();
    expect(newPassword.value).not.toBe(rawPassword);
  });

  it('should return true when comparing same password', () => {
    // Arrange
    const rawPassword = '123456789';

    // Act
    const newPassword = new Password(rawPassword);

    // Assert
    expect(Password.compare(rawPassword, newPassword.value)).toBe(true);
  });

  it('should return false when comparing different password', () => {
    // Arrange
    const rawPassword = '123456789';
    const anotherRawPassword = '987654321';

    // Act
    const newPassword = new Password(rawPassword);

    // Assert
    expect(Password.compare(anotherRawPassword, newPassword.value)).toBe(false);
  });

  it('should generate a random password with 8 characters', () => {
    // Act
    const randomPassword = Password.generateRandom();

    // Assert
    expect(randomPassword).toHaveLength(8);
  });
});
