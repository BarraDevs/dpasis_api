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
});
