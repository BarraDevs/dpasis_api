"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const class_transformer_1 = require("class-transformer");
const trim_1 = require("./trim");
describe('Trim', () => {
    class TestClass {
        value;
        valueWithGroup;
        normalValue;
    }
    __decorate([
        (0, trim_1.Trim)(),
        __metadata("design:type", String)
    ], TestClass.prototype, "value", void 0);
    __decorate([
        (0, trim_1.Trim)({ groups: ['test'] }),
        __metadata("design:type", String)
    ], TestClass.prototype, "valueWithGroup", void 0);
    describe('string trimming', () => {
        it('should trim leading whitespace from strings', () => {
            const plain = { value: '   hello world' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello world');
            expect(typeof instance.value).toBe('string');
        });
        it('should trim trailing whitespace from strings', () => {
            const plain = { value: 'hello world   ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello world');
            expect(typeof instance.value).toBe('string');
        });
        it('should trim both leading and trailing whitespace from strings', () => {
            const plain = { value: '   hello world   ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello world');
            expect(typeof instance.value).toBe('string');
        });
        it('should preserve internal whitespace in strings', () => {
            const plain = { value: '   hello   world   ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello   world');
            expect(typeof instance.value).toBe('string');
        });
        it('should handle strings with only whitespace', () => {
            const plain = { value: '   ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('');
            expect(typeof instance.value).toBe('string');
        });
        it('should handle empty strings', () => {
            const plain = { value: '' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('');
            expect(typeof instance.value).toBe('string');
        });
        it('should leave already trimmed strings unchanged', () => {
            const plain = { value: 'hello world' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello world');
            expect(typeof instance.value).toBe('string');
        });
    });
    describe('whitespace types handling', () => {
        it('should trim spaces', () => {
            const plain = { value: '   hello   ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello');
        });
        it('should trim tabs', () => {
            const plain = { value: '\t\thello\t\t' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello');
        });
        it('should trim newlines', () => {
            const plain = { value: '\n\nhello\n\n' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello');
        });
        it('should trim carriage returns', () => {
            const plain = { value: '\r\rhello\r\r' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello');
        });
        it('should trim mixed whitespace characters', () => {
            const plain = { value: ' \t\n\rhello\r\n\t ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello');
        });
        it('should trim non-breaking spaces', () => {
            const plain = { value: '\u00A0\u00A0hello\u00A0\u00A0' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello');
        });
    });
    describe('non-string value handling', () => {
        it('should leave number values unchanged', () => {
            const plain = { value: 123 };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(123);
            expect(typeof instance.value).toBe('number');
        });
        it('should leave boolean values unchanged', () => {
            const plain = { value: true };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(true);
            expect(typeof instance.value).toBe('boolean');
        });
        it('should leave null values unchanged', () => {
            const plain = { value: null };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(null);
        });
        it('should leave undefined values unchanged', () => {
            const plain = { value: undefined };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBeUndefined();
        });
        it('should leave object values unchanged', () => {
            const obj = { nested: 'value' };
            const plain = { value: obj };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toStrictEqual(obj);
            expect(typeof instance.value).toBe('object');
        });
        it('should leave array values unchanged', () => {
            const arr = [1, 2, 3];
            const plain = { value: arr };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toStrictEqual(arr);
            expect(Array.isArray(instance.value)).toBe(true);
        });
        it('should leave Date values unchanged', () => {
            const date = new Date();
            const plain = { value: date };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toStrictEqual(date);
            expect(instance.value).toBeInstanceOf(Date);
        });
        it('should leave function values unchanged', () => {
            const fn = () => 'test';
            const plain = { value: fn };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(fn);
            expect(typeof instance.value).toBe('function');
        });
        it('should leave symbol values unchanged', () => {
            const sym = Symbol('test');
            const plain = { value: sym };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(sym);
            expect(typeof instance.value).toBe('symbol');
        });
        it('should leave bigint values unchanged', () => {
            const bigintValue = BigInt(123);
            const plain = { value: bigintValue };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(bigintValue);
            expect(typeof instance.value).toBe('bigint');
        });
    });
    describe('transformer options', () => {
        it('should respect group options when specified', () => {
            const plain = { valueWithGroup: '   test   ' };
            const instanceWithoutGroup = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instanceWithoutGroup.valueWithGroup).toBe('   test   ');
            expect(typeof instanceWithoutGroup.valueWithGroup).toBe('string');
            const instanceWithGroup = (0, class_transformer_1.plainToInstance)(TestClass, plain, { groups: ['test'] });
            expect(instanceWithGroup.valueWithGroup).toBe('test');
            expect(typeof instanceWithGroup.valueWithGroup).toBe('string');
        });
    });
    describe('edge cases', () => {
        it('should handle strings with unicode characters', () => {
            const plain = { value: '   héllo wörld   ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('héllo wörld');
        });
        it('should handle strings with emojis', () => {
            const plain = { value: '   hello 👋 world 🌍   ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('hello 👋 world 🌍');
        });
        it('should handle very long strings', () => {
            const longString = '   ' + 'a'.repeat(10000) + '   ';
            const plain = { value: longString };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('a'.repeat(10000));
            expect(instance.value.length).toBe(10000);
        });
        it('should handle strings with only unicode whitespace', () => {
            const plain = { value: '\u00A0\u1680\u2000\u2001\u2002\u2003' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe('');
        });
    });
    describe('multiple properties', () => {
        class MultiplePropsClass {
            prop1;
            prop2;
            normalProp;
        }
        __decorate([
            (0, trim_1.Trim)(),
            __metadata("design:type", String)
        ], MultiplePropsClass.prototype, "prop1", void 0);
        __decorate([
            (0, trim_1.Trim)(),
            __metadata("design:type", String)
        ], MultiplePropsClass.prototype, "prop2", void 0);
        it('should transform multiple properties independently', () => {
            const plain = {
                prop1: '   hello   ',
                prop2: '   world   ',
                normalProp: '   unchanged   ',
            };
            const instance = (0, class_transformer_1.plainToInstance)(MultiplePropsClass, plain);
            expect(instance.prop1).toBe('hello');
            expect(instance.prop2).toBe('world');
            expect(instance.normalProp).toBe('   unchanged   ');
        });
        it('should handle mixed string and non-string values', () => {
            const plain = {
                prop1: '   hello   ',
                prop2: 123,
            };
            const instance = (0, class_transformer_1.plainToInstance)(MultiplePropsClass, plain);
            expect(instance.prop1).toBe('hello');
            expect(instance.prop2).toBe(123);
        });
    });
    describe('nested objects', () => {
        class NestedClass {
            nestedValue;
        }
        __decorate([
            (0, trim_1.Trim)(),
            __metadata("design:type", String)
        ], NestedClass.prototype, "nestedValue", void 0);
        class ParentClass {
            parentValue;
            nested;
        }
        __decorate([
            (0, trim_1.Trim)(),
            __metadata("design:type", String)
        ], ParentClass.prototype, "parentValue", void 0);
        it('should trim values in nested objects', () => {
            const plain = {
                parentValue: '   parent   ',
                nested: {
                    nestedValue: '   nested   ',
                },
            };
            const instance = (0, class_transformer_1.plainToInstance)(ParentClass, plain);
            expect(instance.parentValue).toBe('parent');
        });
    });
});
//# sourceMappingURL=trim.spec.js.map