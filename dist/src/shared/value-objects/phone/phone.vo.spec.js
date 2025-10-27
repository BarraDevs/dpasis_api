"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phone_error_1 = require("./phone.error");
const phone_vo_1 = require("./phone.vo");
describe('Phone Value Object', () => {
    it.each([
        null,
        undefined,
        '',
        '           ',
        '1',
        'invalid-phone',
        '(000) 00000-0000',
        '(00) 12345-12345',
        '(11) 1234-123',
        '123456789',
        '123456789123456',
    ])('should throw an error when providing invalid phone (%s)', (phone) => {
        expect(() => new phone_vo_1.Phone(phone)).toThrow('Telefone inválido');
        expect(() => new phone_vo_1.Phone(phone)).toThrow(phone_error_1.InvalidPhoneError);
    });
    it.each([
        '(11) 12345-1234',
        '00 12345-1234',
        '00 123451234',
        '00 12345123',
        '00123456789',
    ])('should create a phone value object when providing valid phone (%s)', (phone) => {
        const phoneVo = new phone_vo_1.Phone(phone);
        expect(phoneVo).toBeInstanceOf(phone_vo_1.Phone);
        expect(phoneVo.value).toBe(phone.replace(/\D/g, ''));
    });
});
//# sourceMappingURL=phone.vo.spec.js.map