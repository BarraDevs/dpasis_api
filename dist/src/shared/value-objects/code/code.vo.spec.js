"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const code_error_1 = require("./code.error");
const code_vo_1 = require("./code.vo");
describe('Code Value Object', () => {
    it('should create a code with a value and expiration time', () => {
        const expirationTimeInMinutes = 5;
        const code = new code_vo_1.Code(expirationTimeInMinutes);
        expect(code.value.code).toBeDefined();
        expect(code.value.expiresIn).toBeDefined();
    });
    it('should generate a code with 6 digits', () => {
        const expirationTimeInMinutes = 5;
        const code = new code_vo_1.Code(expirationTimeInMinutes);
        expect(code.value.code.length).toBe(6);
    });
    it('should generate a code with only numbers', () => {
        const expirationTimeInMinutes = 5;
        const code = new code_vo_1.Code(expirationTimeInMinutes);
        const isOnlyNumber = (0, class_validator_1.isNumber)(+code.value.code);
        expect(isOnlyNumber).toBe(true);
    });
    it.each([1, 5, 10, 250, 10999])('should generate a code that expires in %s minutes', (minutes) => {
        const code = new code_vo_1.Code(minutes);
        const expirationTime = Date.now() + (minutes * 60 * 1000);
        expect(code.value.expiresIn).toBe(expirationTime);
    });
    it('should throw an error when providing a negative expiration time', () => {
        expect(() => new code_vo_1.Code(-1)).toThrow('Tempo de expiração inválido');
        expect(() => new code_vo_1.Code(-1)).toThrow(code_error_1.InvalidExpirationTimeError);
    });
    it('should throw an error when providing a zero expiration time', () => {
        expect(() => new code_vo_1.Code(0)).toThrow('Tempo de expiração inválido');
        expect(() => new code_vo_1.Code(0)).toThrow(code_error_1.InvalidExpirationTimeError);
    });
});
//# sourceMappingURL=code.vo.spec.js.map