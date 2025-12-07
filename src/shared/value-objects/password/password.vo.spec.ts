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

  it('should hash the same password differently each time', () => {
    // Arrange
    const rawPassword = 'SamePassword123!';

    // Act
    const password1 = new Password(rawPassword);
    const password2 = new Password(rawPassword);

    // Assert
    expect(password1.value).not.toBe(password2.value);
    expect(password1.value).toBeDefined();
    expect(password2.value).toBeDefined();
  });

  it('should create valid bcrypt hash', () => {
    // Arrange
    const rawPassword = 'ValidPassword123!';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt format
    expect(password.value.length).toBeGreaterThan(50);
  });

  it('should hash empty string password', () => {
    // Arrange
    const rawPassword = '';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toBeDefined();
    expect(password.value).not.toBe('');
    expect(Password.compare('', password.value)).toBe(true);
  });

  it('should hash password with special characters', () => {
    // Arrange
    const rawPassword = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toBeDefined();
    expect(Password.compare(rawPassword, password.value)).toBe(true);
  });

  it('should hash very long password', () => {
    // Arrange
    const rawPassword = 'A'.repeat(100);

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toBeDefined();
    expect(Password.compare(rawPassword, password.value)).toBe(true);
  });

  it('should hash password with unicode characters', () => {
    // Arrange
    const rawPassword = 'Señ@123!🔒';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toBeDefined();
    expect(Password.compare(rawPassword, password.value)).toBe(true);
  });

  it('should hash password with spaces', () => {
    // Arrange
    const rawPassword = 'Pass Word 123 ';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toBeDefined();
    expect(Password.compare(rawPassword, password.value)).toBe(true);
    expect(Password.compare('PassWord123', password.value)).toBe(false);
  });

  it('should return false when comparing with wrong password case', () => {
    // Arrange
    const rawPassword = 'Password123';
    const wrongCase = 'password123';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(Password.compare(wrongCase, password.value)).toBe(false);
  });

  it('should generate different random passwords each time', () => {
    // Act
    const random1 = Password.generateRandom();
    const random2 = Password.generateRandom();
    const random3 = Password.generateRandom();

    // Assert
    expect(random1).not.toBe(random2);
    expect(random2).not.toBe(random3);
    expect(random1).not.toBe(random3);
  });

  it('should generate random password with alphanumeric characters', () => {
    // Act
    const randomPassword = Password.generateRandom();

    // Assert
    expect(randomPassword).toMatch(/^[a-z0-9]+$/);
  });

  it('should return false when comparing with empty hash', () => {
    // Arrange
    const rawPassword = 'TestPassword';

    // Act & Assert
    expect(Password.compare(rawPassword, '')).toBe(false);
  });

  it('should return false when comparing empty password with hash', () => {
    // Arrange
    const rawPassword = 'TestPassword';
    const password = new Password(rawPassword);

    // Act & Assert
    expect(Password.compare('', password.value)).toBe(false);
  });

  it('should handle password with only numbers', () => {
    // Arrange
    const rawPassword = '1234567890';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toBeDefined();
    expect(Password.compare(rawPassword, password.value)).toBe(true);
  });

  it('should handle password with only special characters', () => {
    // Arrange
    const rawPassword = '!@#$%^&*()';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).toBeDefined();
    expect(Password.compare(rawPassword, password.value)).toBe(true);
  });

  it('should not expose the original password', () => {
    // Arrange
    const rawPassword = 'SecretPassword123!';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(password.value).not.toContain(rawPassword);
    expect(password.value).not.toContain('Secret');
    expect(password.value).not.toContain('Password');
  });

  it('should compare passwords with similar but different values correctly', () => {
    // Arrange
    const password1 = 'Password1';
    const password2 = 'Password2';

    // Act
    const hashedPassword1 = new Password(password1);

    // Assert
    expect(Password.compare(password1, hashedPassword1.value)).toBe(true);
    expect(Password.compare(password2, hashedPassword1.value)).toBe(false);
  });

  it('should handle password with leading/trailing whitespace', () => {
    // Arrange
    const rawPassword = '  Password123  ';

    // Act
    const password = new Password(rawPassword);

    // Assert
    expect(Password.compare(rawPassword, password.value)).toBe(true);
    expect(Password.compare('Password123', password.value)).toBe(false);
  });

  it('should generate random passwords that can be hashed', () => {
    // Act
    const randomPassword = Password.generateRandom();
    const hashedRandom = new Password(randomPassword);

    // Assert
    expect(hashedRandom.value).toBeDefined();
    expect(Password.compare(randomPassword, hashedRandom.value)).toBe(true);
  });

  it('should handle multiple password comparisons correctly', () => {
    // Arrange
    const rawPassword = 'MultiTest123';
    const password = new Password(rawPassword);

    // Act & Assert
    expect(Password.compare(rawPassword, password.value)).toBe(true);
    expect(Password.compare(rawPassword, password.value)).toBe(true);
    expect(Password.compare(rawPassword, password.value)).toBe(true);
  });
});
