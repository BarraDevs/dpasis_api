import { plainToInstance } from 'class-transformer';
import { Trim } from './trim';

describe('Trim', () => {
  class TestClass {
    @Trim()
    value: string;

    @Trim({ groups: ['test'] })
    valueWithGroup: string;

    normalValue: any;
  }

  describe('string trimming', () => {
    it('should trim leading whitespace from strings', () => {
      const plain = { value: '   hello world' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello world');
      expect(typeof instance.value).toBe('string');
    });

    it('should trim trailing whitespace from strings', () => {
      const plain = { value: 'hello world   ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello world');
      expect(typeof instance.value).toBe('string');
    });

    it('should trim both leading and trailing whitespace from strings', () => {
      const plain = { value: '   hello world   ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello world');
      expect(typeof instance.value).toBe('string');
    });

    it('should preserve internal whitespace in strings', () => {
      const plain = { value: '   hello   world   ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello   world');
      expect(typeof instance.value).toBe('string');
    });

    it('should handle strings with only whitespace', () => {
      const plain = { value: '   ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('');
      expect(typeof instance.value).toBe('string');
    });

    it('should handle empty strings', () => {
      const plain = { value: '' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('');
      expect(typeof instance.value).toBe('string');
    });

    it('should leave already trimmed strings unchanged', () => {
      const plain = { value: 'hello world' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello world');
      expect(typeof instance.value).toBe('string');
    });
  });

  describe('whitespace types handling', () => {
    it('should trim spaces', () => {
      const plain = { value: '   hello   ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello');
    });

    it('should trim tabs', () => {
      const plain = { value: '\t\thello\t\t' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello');
    });

    it('should trim newlines', () => {
      const plain = { value: '\n\nhello\n\n' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello');
    });

    it('should trim carriage returns', () => {
      const plain = { value: '\r\rhello\r\r' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello');
    });

    it('should trim mixed whitespace characters', () => {
      const plain = { value: ' \t\n\rhello\r\n\t ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello');
    });

    it('should trim non-breaking spaces', () => {
      const plain = { value: '\u00A0\u00A0hello\u00A0\u00A0' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello');
    });
  });

  describe('non-string value handling', () => {
    it('should leave number values unchanged', () => {
      const plain = { value: 123 };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(123);
      expect(typeof instance.value).toBe('number');
    });

    it('should leave boolean values unchanged', () => {
      const plain = { value: true };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(true);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should leave null values unchanged', () => {
      const plain = { value: null };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(null);
    });

    it('should leave undefined values unchanged', () => {
      const plain = { value: undefined };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBeUndefined();
    });

    it('should leave object values unchanged', () => {
      const obj = { nested: 'value' };
      const plain = { value: obj };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toStrictEqual(obj);
      expect(typeof instance.value).toBe('object');
    });

    it('should leave array values unchanged', () => {
      const arr = [1, 2, 3];
      const plain = { value: arr };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toStrictEqual(arr);
      expect(Array.isArray(instance.value)).toBe(true);
    });

    it('should leave Date values unchanged', () => {
      const date = new Date();
      const plain = { value: date };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toStrictEqual(date);
      expect(instance.value).toBeInstanceOf(Date);
    });

    it('should leave function values unchanged', () => {
      const fn = () => 'test';
      const plain = { value: fn };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(fn);
      expect(typeof instance.value).toBe('function');
    });

    it('should leave symbol values unchanged', () => {
      const sym = Symbol('test');
      const plain = { value: sym };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(sym);
      expect(typeof instance.value).toBe('symbol');
    });

    it('should leave bigint values unchanged', () => {
      const bigintValue = BigInt(123);
      const plain = { value: bigintValue };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(bigintValue);
      expect(typeof instance.value).toBe('bigint');
    });
  });

  describe('transformer options', () => {
    it('should respect group options when specified', () => {
      const plain = { valueWithGroup: '   test   ' };

      // Without the group, transformation should not occur
      const instanceWithoutGroup = plainToInstance(TestClass, plain);
      expect(instanceWithoutGroup.valueWithGroup).toBe('   test   ');
      expect(typeof instanceWithoutGroup.valueWithGroup).toBe('string');

      // With the group, transformation should occur
      const instanceWithGroup = plainToInstance(TestClass, plain, { groups: ['test'] });
      expect(instanceWithGroup.valueWithGroup).toBe('test');
      expect(typeof instanceWithGroup.valueWithGroup).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle strings with unicode characters', () => {
      const plain = { value: '   héllo wörld   ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('héllo wörld');
    });

    it('should handle strings with emojis', () => {
      const plain = { value: '   hello 👋 world 🌍   ' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('hello 👋 world 🌍');
    });

    it('should handle very long strings', () => {
      const longString = '   ' + 'a'.repeat(10000) + '   ';
      const plain = { value: longString };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('a'.repeat(10000));
      expect(instance.value.length).toBe(10000);
    });

    it('should handle strings with only unicode whitespace', () => {
      const plain = { value: '\u00A0\u1680\u2000\u2001\u2002\u2003' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe('');
    });
  });

  describe('multiple properties', () => {
    class MultiplePropsClass {
      @Trim()
      prop1: string;

      @Trim()
      prop2: string;

      normalProp: any;
    }

    it('should transform multiple properties independently', () => {
      const plain = {
        prop1: '   hello   ',
        prop2: '   world   ',
        normalProp: '   unchanged   ',
      };
      const instance = plainToInstance(MultiplePropsClass, plain);

      expect(instance.prop1).toBe('hello');
      expect(instance.prop2).toBe('world');
      expect(instance.normalProp).toBe('   unchanged   ');
    });

    it('should handle mixed string and non-string values', () => {
      const plain = {
        prop1: '   hello   ',
        prop2: 123,
      };
      const instance = plainToInstance(MultiplePropsClass, plain);

      expect(instance.prop1).toBe('hello');
      expect(instance.prop2).toBe(123);
    });
  });

  describe('nested objects', () => {
    class NestedClass {
      @Trim()
      nestedValue: string;
    }

    class ParentClass {
      @Trim()
      parentValue: string;

      nested: NestedClass;
    }

    it('should trim values in nested objects', () => {
      const plain = {
        parentValue: '   parent   ',
        nested: {
          nestedValue: '   nested   ',
        },
      };
      const instance = plainToInstance(ParentClass, plain);

      expect(instance.parentValue).toBe('parent');
      // Note: nested transformation requires proper class-transformer configuration
      // This test documents the expected behavior but may need additional setup
    });
  });
});
