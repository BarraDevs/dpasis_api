"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cpf_error_1 = require("./cpf.error");
const cpf_vo_1 = require("./cpf.vo");
describe('CPF Value Object', () => {
    it.each([
        null,
        undefined,
        '',
        '           ',
        'invalid-cpf',
        '111.111',
        '111.111.111-11',
        '111.111.111.112',
        '012.345.678-00',
        '374.852.529-07',
    ])('should throw an error when providing invalid cpf (%s)', (cpf) => {
        expect(() => new cpf_vo_1.CPF(cpf)).toThrow('CPF inválido');
        expect(() => new cpf_vo_1.CPF(cpf)).toThrow(cpf_error_1.InvalidCpfError);
    });
    it.each([
        '974.563.215-58',
        '714.287.938-60',
        '877.482.488-00',
        '123.456.789-09',
    ])('should create a cpf value object when providing valid cpf (%s)', (cpf) => {
        const cpfVo = new cpf_vo_1.CPF(cpf);
        expect(cpfVo).toBeInstanceOf(cpf_vo_1.CPF);
        expect(cpfVo.value).toBe(cpf.replace(/[.-]/g, ''));
    });
});
//# sourceMappingURL=cpf.vo.spec.js.map