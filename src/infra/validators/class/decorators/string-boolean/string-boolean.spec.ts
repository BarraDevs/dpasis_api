import { plainToInstance } from 'class-transformer';
import { StringToBoolean } from './string-boolean';

describe('StringToBoolean', () => {
  class TestClass {
    @StringToBoolean()
    value: boolean;

    @StringToBoolean({ groups: ['test'] })
    valueWithGroup: boolean;

    normalValue: any;
  }

  describe('string to boolean transformation', () => {
    it('should transform "true" string to boolean true', () => {
      const plain = { value: 'true' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(true);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform "TRUE" string to boolean true (case insensitive)', () => {
      const plain = { value: 'TRUE' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(true);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform "TrUe" string to boolean true (mixed case)', () => {
      const plain = { value: 'TrUe' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(true);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform "false" string to boolean false', () => {
      const plain = { value: 'false' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform "FALSE" string to boolean false', () => {
      const plain = { value: 'FALSE' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform empty string to boolean false', () => {
      const plain = { value: '' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform any other string to boolean false', () => {
      const plain = { value: 'invalid' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform "1" string to boolean false (not "true")', () => {
      const plain = { value: '1' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should transform "0" string to boolean false', () => {
      const plain = { value: '0' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });
  });

  describe('non-string value handling', () => {
    it('should leave boolean true unchanged', () => {
      const plain = { value: true };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(true);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should leave boolean false unchanged', () => {
      const plain = { value: false };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should leave number values unchanged', () => {
      const plain = { value: 123 };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(123);
      expect(typeof instance.value).toBe('number');
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
  });

  describe('transformer options', () => {
    it('should respect group options when specified', () => {
      const plain = { valueWithGroup: 'true' };

      // Without the group, transformation should not occur
      const instanceWithoutGroup = plainToInstance(TestClass, plain);
      expect(instanceWithoutGroup.valueWithGroup).toBe('true');
      expect(typeof instanceWithoutGroup.valueWithGroup).toBe('string');

      // With the group, transformation should occur
      const instanceWithGroup = plainToInstance(TestClass, plain, { groups: ['test'] });
      expect(instanceWithGroup.valueWithGroup).toBe(true);
      expect(typeof instanceWithGroup.valueWithGroup).toBe('boolean');
    });

    it('should not transform when group does not match', () => {
      const plain = { valueWithGroup: 'false' };

      const instanceWithWrongGroup = plainToInstance(TestClass, plain, { groups: ['other'] });
      expect(instanceWithWrongGroup.valueWithGroup).toBe('false');
      expect(typeof instanceWithWrongGroup.valueWithGroup).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle strings with leading/trailing whitespace as false', () => {
      const plain = { value: '  true  ' };
      const instance = plainToInstance(TestClass, plain);

      // Whitespace will be included, so "  true  ".toLowerCase() !== "true"
      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should handle "yes" string as false', () => {
      const plain = { value: 'yes' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should handle "no" string as false', () => {
      const plain = { value: 'no' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should handle "on" string as false', () => {
      const plain = { value: 'on' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should handle "off" string as false', () => {
      const plain = { value: 'off' };
      const instance = plainToInstance(TestClass, plain);

      expect(instance.value).toBe(false);
      expect(typeof instance.value).toBe('boolean');
    });
  });

  describe('multiple properties', () => {
    class MultiplePropsClass {
      @StringToBoolean()
      prop1: boolean;

      @StringToBoolean()
      prop2: boolean;

      normalProp: any;
    }

    it('should transform multiple properties independently', () => {
      const plain = {
        prop1: 'true',
        prop2: 'false',
        normalProp: 'unchanged',
      };
      const instance = plainToInstance(MultiplePropsClass, plain);

      expect(instance.prop1).toBe(true);
      expect(instance.prop2).toBe(false);
      expect(instance.normalProp).toBe('unchanged');
    });

    it('should handle mixed string and boolean values', () => {
      const plain = {
        prop1: 'true',
        prop2: true,
      };
      const instance = plainToInstance(MultiplePropsClass, plain);

      expect(instance.prop1).toBe(true);
      expect(instance.prop2).toBe(true);
    });

    it('should handle all properties as "true" string', () => {
      const plain = {
        prop1: 'TRUE',
        prop2: 'true',
      };
      const instance = plainToInstance(MultiplePropsClass, plain);

      expect(instance.prop1).toBe(true);
      expect(instance.prop2).toBe(true);
    });
  });
});
