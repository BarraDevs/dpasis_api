"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPF = void 0;
const cpf_error_1 = require("./cpf.error");
const CPF_LENGTH = 11;
class CPF {
    _value;
    get value() {
        return this._value;
    }
    constructor(rawCpf) {
        const cpf = this.sanitize(rawCpf);
        if (!this.validate(cpf)) {
            throw new cpf_error_1.InvalidCpfError();
        }
        this._value = cpf;
    }
    sanitize(cpf) {
        return cpf?.replace(/[\s./-]*/gim, '');
    }
    validate(cpf) {
        if (!cpf)
            return false;
        if (cpf.length !== CPF_LENGTH)
            return false;
        if (this.allDigitsAreEqual(cpf))
            return false;
        const firstDigit = this.calculateDigit(cpf, 9);
        if (firstDigit !== Number(cpf.substring(9, 10)))
            return false;
        const secondDigit = this.calculateDigit(cpf, 10);
        if (secondDigit !== Number(cpf.substring(10, 11)))
            return false;
        return true;
    }
    allDigitsAreEqual(cpf) {
        return cpf.split('').every((digit) => digit === cpf[0]);
    }
    calculateDigit(cpf, length) {
        let sum = 0;
        let rest = 0;
        for (let i = 1; i <= length; i++) {
            sum += Number(cpf.substring(i - 1, i)) * (length + 2 - i);
        }
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11)
            rest = 0;
        return rest;
    }
}
exports.CPF = CPF;
//# sourceMappingURL=cpf.vo.js.map