"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const email_error_1 = require("./email.error");
const email_vo_1 = require("./email.vo");
describe('Email Value Object', () => {
    it.each([
        null,
        undefined,
        '',
        '           ',
        'invalid-email',
        'invalid-email@',
        'invalid-email.com',
        'invalid-email@.com',
        'invalid-email@@.com.',
        'invalid-email@invalid-domain',
        'invalid-email@invalid-domain.',
        'invalid-email@invalid-domain.c',
    ])('should throw an error when providing invalid email (%s)', (email) => {
        expect(() => new email_vo_1.Email(email)).toThrow('E-mail inválido');
        expect(() => new email_vo_1.Email(email)).toThrow(email_error_1.InvalidEmailError);
    });
    it.each([
        'jhondoe@email.com',
        'jhondoe@email.com.br',
        'jhondoe@gmail.com',
        'jhondoe12@yahoo.com.br',
    ])('should create a email value object when providing valid email (%s)', (email) => {
        const emailVo = new email_vo_1.Email(email);
        expect(emailVo).toBeInstanceOf(email_vo_1.Email);
        expect(emailVo.value).toBe(email);
    });
});
//# sourceMappingURL=email.vo.spec.js.map