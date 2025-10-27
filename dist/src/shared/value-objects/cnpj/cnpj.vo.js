"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CNPJ = void 0;
const cnpj_error_1 = require("./cnpj.error");
const CNPJ_LENGTH = 14;
class CNPJ {
    _value;
    multipliesFirstDigit = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    multipliesSecondDigit = [6, ...this.multipliesFirstDigit];
    get value() {
        return this._value;
    }
    constructor(rawCnpj) {
        const cnpj = this.sanitize(rawCnpj);
        if (!this.validate(cnpj)) {
            throw new cnpj_error_1.InvalidCnpjError();
        }
        this._value = cnpj;
    }
    sanitize(cnpj) {
        return cnpj?.replace(/[\s./-]*/gim, '');
    }
    validate(cnpj) {
        if (!cnpj)
            return false;
        if (cnpj.length !== CNPJ_LENGTH)
            return false;
        if (this.allDigitsAreEqual(cnpj))
            return false;
        const digits = cnpj.split('').map(Number);
        const firstDigit = this.calculateDigit(cnpj, 12, this.multipliesFirstDigit);
        if (firstDigit !== digits[12])
            return false;
        const secondDigit = this.calculateDigit(cnpj, 13, this.multipliesSecondDigit);
        if (secondDigit !== digits[13])
            return false;
        return true;
    }
    allDigitsAreEqual(cnpj) {
        return cnpj.split('').every((digit) => digit === cnpj[0]);
    }
    calculateDigit(cnpj, length, multipliers) {
        let sum = 0;
        let rest = 0;
        for (let i = 0; i < length; i++) {
            const digit = Number(cnpj.substring(i, i + 1));
            sum += digit * multipliers[i];
        }
        rest = sum % 11;
        if (rest < 2)
            rest = 0;
        else
            rest = 11 - rest;
        return rest;
    }
}
exports.CNPJ = CNPJ;
//# sourceMappingURL=cnpj.vo.js.map