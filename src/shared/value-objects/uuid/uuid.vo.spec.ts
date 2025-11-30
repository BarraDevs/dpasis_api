import { UUID } from './uuid.vo';

describe('UUID Value Object', () => {
  it('should generate a UUID if no value is provided', () => {
    // Act
    const uuidVo = new UUID();

    // Assert
    expect(uuidVo).toBeInstanceOf(UUID);
    expect(uuidVo.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should use the provided UUID value', () => {
    // Arrange
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const uuidVo = new UUID(validUuid);

    // Assert
    expect(uuidVo).toBeInstanceOf(UUID);
    expect(uuidVo.value).toBe(validUuid);
  });
});
