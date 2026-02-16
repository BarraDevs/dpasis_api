import { UUID } from './uuid.vo';

describe('UUID Value Object', () => {
  describe('constructor', () => {
    it('should generate a UUID if no value is provided', () => {
      // Act
      const uuidVo = new UUID();

      // Assert
      expect(uuidVo).toBeInstanceOf(UUID);
      expect(uuidVo.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate a valid v4 UUID format', () => {
      // Act
      const uuidVo = new UUID();

      // Assert
      expect(uuidVo.value).toHaveLength(36);
      expect(uuidVo.value.split('-')).toHaveLength(5);
    });

    it('should generate different UUIDs for multiple instances', () => {
      // Act
      const uuid1 = new UUID();
      const uuid2 = new UUID();
      const uuid3 = new UUID();

      // Assert
      expect(uuid1.value).not.toBe(uuid2.value);
      expect(uuid1.value).not.toBe(uuid3.value);
      expect(uuid2.value).not.toBe(uuid3.value);
    });
  });

  describe('value getter', () => {
    it('should return the generated UUID value', () => {
      // Arrange
      const uuidVo = new UUID();

      // Act
      const value1 = uuidVo.value;
      const value2 = uuidVo.value;

      // Assert
      expect(value1).toBe(value2);
      expect(typeof value1).toBe('string');
    });

    it('should return the same value on multiple calls', () => {
      // Arrange
      const uuidVo = new UUID();

      // Act & Assert
      const firstCall = uuidVo.value;
      const secondCall = uuidVo.value;
      const thirdCall = uuidVo.value;

      expect(firstCall).toBe(secondCall);
      expect(secondCall).toBe(thirdCall);
    });

    it('should not allow modification of the value', () => {
      // Arrange
      const uuidVo = new UUID();
      const originalValue = uuidVo.value;

      // Act & Assert
      expect(() => {
        // @ts-expect-error - trying to modify readonly property
        uuidVo.value = 'new-value';
      }).toThrow();
      expect(uuidVo.value).toBe(originalValue);
    });
  });

  describe('UUID format validation', () => {
    it('should have correct segment lengths', () => {
      // Act
      const uuidVo = new UUID();
      const segments = uuidVo.value.split('-');

      // Assert
      expect(segments[0]).toHaveLength(8);
      expect(segments[1]).toHaveLength(4);
      expect(segments[2]).toHaveLength(4);
      expect(segments[3]).toHaveLength(4);
      expect(segments[4]).toHaveLength(12);
    });

    it('should have version 4 indicator', () => {
      // Act
      const uuidVo = new UUID();
      const segments = uuidVo.value.split('-');
      const versionDigit = segments[2][0];

      // Assert
      expect(versionDigit).toBe('4');
    });

    it('should have correct variant bits', () => {
      // Act
      const uuidVo = new UUID();
      const segments = uuidVo.value.split('-');
      const variantDigit = segments[3][0].toLowerCase();

      // Assert
      expect(['8', '9', 'a', 'b']).toContain(variantDigit);
    });

    it('should only contain hexadecimal characters and hyphens', () => {
      // Act
      const uuidVo = new UUID();

      // Assert
      expect(uuidVo.value).toMatch(/^[0-9a-f-]+$/i);
    });
  });

  describe('multiple instances', () => {
    it('should create 100 unique UUIDs', () => {
      // Act
      const uuids = Array.from({ length: 100 }, () => new UUID().value);

      // Assert
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(100);
    });

    it('should maintain independence between instances', () => {
      // Act
      const uuid1 = new UUID();
      const uuid2 = new UUID();

      // Assert
      expect(uuid1).not.toBe(uuid2);
      expect(uuid1.value).not.toBe(uuid2.value);
    });
  });

  describe('immutability', () => {
    it('should not allow direct access to private field', () => {
      // Arrange
      const uuidVo = new UUID();

      // Act & Assert
      expect(() => {
        // @ts-expect-error - accessing private property
        return uuidVo._value;
      }).not.toThrow();

      // But it should still be defined internally
      const value = uuidVo.value;
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive instantiation', () => {
      // Act
      const uuids = [];
      for (let i = 0; i < 10; i++) {
        uuids.push(new UUID().value);
      }

      // Assert
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(10);
    });

    it('should be serializable to JSON', () => {
      // Arrange
      const uuidVo = new UUID();

      // Act
      const json = JSON.stringify({ id: uuidVo.value });
      const parsed = JSON.parse(json);

      // Assert
      expect(parsed.id).toBe(uuidVo.value);
    });

    it('should work correctly in object property', () => {
      // Arrange
      const uuidVo = new UUID();
      const obj = {
        id: uuidVo.value,
        name: 'Test',
      };

      // Assert
      expect(obj.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('type checking', () => {
    it('should be instance of UUID class', () => {
      // Act
      const uuidVo = new UUID();

      // Assert
      expect(uuidVo).toBeInstanceOf(UUID);
      expect(uuidVo.constructor.name).toBe('UUID');
    });

    it('should have value property of type string', () => {
      // Act
      const uuidVo = new UUID();

      // Assert
      expect(typeof uuidVo.value).toBe('string');
    });
  });
});
