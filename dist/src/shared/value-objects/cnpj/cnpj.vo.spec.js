"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cnpj_error_1 = require("./cnpj.error");
const cnpj_vo_1 = require("./cnpj.vo");
describe('CNPJ Value Object', () => {
    it.each([
        null,
        undefined,
        '',
        '           ',
        'invalid-cnpj',
        '11.111.1',
        '11.111.111/0001-112456',
        '11.111.111/0001-11',
        '01.234.567/0008-00',
        '37.485.252/0009-07',
        '11.111.111/1111-11',
        '47.846.258/0001-71',
    ])('should throw an error when providing invalid cnpj (%s)', (cnpj) => {
        expect(() => new cnpj_vo_1.CNPJ(cnpj)).toThrow('CNPJ inválido');
        expect(() => new cnpj_vo_1.CNPJ(cnpj)).toThrow(cnpj_error_1.InvalidCnpjError);
    });
    it.each([
        '09.748.165/0001-10',
        '27.190.423/0001-78',
        '20.293.629/0001-84',
        '53.598.299/0001-94',
        '16.474.222/0001-86',
    ])('should create a cnpj value object when providing valid cnpj (%s)', (cnpj) => {
        const cnpjVo = new cnpj_vo_1.CNPJ(cnpj);
        expect(cnpjVo).toBeInstanceOf(cnpj_vo_1.CNPJ);
        expect(cnpjVo.value).toBe(cnpj.replace(/[/.-]/g, ''));
    });
});
//# sourceMappingURL=cnpj.vo.spec.js.map