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
const string_number_1 = require("./string-number");
describe('StringToNumber', () => {
    class TestClass {
        value;
        valueWithGroup;
        normalValue;
    }
    __decorate([
        (0, string_number_1.StringToNumber)(),
        __metadata("design:type", Number)
    ], TestClass.prototype, "value", void 0);
    __decorate([
        (0, string_number_1.StringToNumber)({ groups: ['test'] }),
        __metadata("design:type", Number)
    ], TestClass.prototype, "valueWithGroup", void 0);
    describe('string to number transformation', () => {
        it('should transform string numbers to actual numbers', () => {
            const plain = { value: '123' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(123);
            expect(typeof instance.value).toBe('number');
        });
        it('should transform string float numbers to actual numbers', () => {
            const plain = { value: '123.45' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(123.45);
            expect(typeof instance.value).toBe('number');
        });
        it('should transform negative string numbers to actual numbers', () => {
            const plain = { value: '-456' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(-456);
            expect(typeof instance.value).toBe('number');
        });
        it('should transform string zero to number zero', () => {
            const plain = { value: '0' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(0);
            expect(typeof instance.value).toBe('number');
        });
        it('should transform empty string to number zero', () => {
            const plain = { value: '' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(0);
            expect(typeof instance.value).toBe('number');
        });
        it('should transform invalid string to NaN', () => {
            const plain = { value: 'invalid' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBeNaN();
            expect(typeof instance.value).toBe('number');
        });
    });
    describe('non-string value handling', () => {
        it('should leave number values unchanged', () => {
            const plain = { value: 789 };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(789);
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
        it('should leave object values unchanged but create new reference', () => {
            const obj = { nested: 'value' };
            const plain = { value: obj };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toStrictEqual(obj);
            expect(typeof instance.value).toBe('object');
        });
        it('should leave array values unchanged but create new reference', () => {
            const arr = [1, 2, 3];
            const plain = { value: arr };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toStrictEqual(arr);
            expect(Array.isArray(instance.value)).toBe(true);
        });
    });
    describe('transformer options', () => {
        it('should respect group options when specified', () => {
            const plain = { valueWithGroup: '999' };
            const instanceWithoutGroup = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instanceWithoutGroup.valueWithGroup).toBe('999');
            expect(typeof instanceWithoutGroup.valueWithGroup).toBe('string');
            const instanceWithGroup = (0, class_transformer_1.plainToInstance)(TestClass, plain, { groups: ['test'] });
            expect(instanceWithGroup.valueWithGroup).toBe(999);
            expect(typeof instanceWithGroup.valueWithGroup).toBe('number');
        });
    });
    describe('edge cases', () => {
        it('should handle scientific notation strings', () => {
            const plain = { value: '1e3' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(1000);
            expect(typeof instance.value).toBe('number');
        });
        it('should handle hexadecimal strings', () => {
            const plain = { value: '0xFF' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(255);
            expect(typeof instance.value).toBe('number');
        });
        it('should handle strings with leading/trailing whitespace', () => {
            const plain = { value: '  123  ' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(123);
            expect(typeof instance.value).toBe('number');
        });
        it('should handle Infinity string', () => {
            const plain = { value: 'Infinity' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(Infinity);
            expect(typeof instance.value).toBe('number');
        });
        it('should handle -Infinity string', () => {
            const plain = { value: '-Infinity' };
            const instance = (0, class_transformer_1.plainToInstance)(TestClass, plain);
            expect(instance.value).toBe(-Infinity);
            expect(typeof instance.value).toBe('number');
        });
    });
    describe('multiple properties', () => {
        class MultiplePropsClass {
            prop1;
            prop2;
            normalProp;
        }
        __decorate([
            (0, string_number_1.StringToNumber)(),
            __metadata("design:type", Number)
        ], MultiplePropsClass.prototype, "prop1", void 0);
        __decorate([
            (0, string_number_1.StringToNumber)(),
            __metadata("design:type", Number)
        ], MultiplePropsClass.prototype, "prop2", void 0);
        it('should transform multiple properties independently', () => {
            const plain = {
                prop1: '100',
                prop2: '200',
                normalProp: 'unchanged',
            };
            const instance = (0, class_transformer_1.plainToInstance)(MultiplePropsClass, plain);
            expect(instance.prop1).toBe(+plain.prop1);
            expect(instance.prop2).toBe(+plain.prop2);
            expect(instance.normalProp).toBe(plain.normalProp);
        });
        it('should handle mixed valid and invalid string numbers', () => {
            const plain = {
                prop1: '100',
                prop2: 'invalid',
            };
            const instance = (0, class_transformer_1.plainToInstance)(MultiplePropsClass, plain);
            expect(instance.prop1).toBe(100);
            expect(instance.prop2).toBeNaN();
        });
    });
});
//# sourceMappingURL=string-number.spec.js.map