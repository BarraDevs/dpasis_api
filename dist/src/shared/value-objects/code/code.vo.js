"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Code = void 0;
const code_error_1 = require("./code.error");
class Code {
    SECONDS_IN_A_MINUTE = 60;
    MILISECONDS_IN_A_SECOND = 1000;
    _value;
    _expiresIn;
    get value() {
        return {
            code: this._value,
            expiresIn: this._expiresIn,
        };
    }
    constructor(expirationTimeInMinutes) {
        if (expirationTimeInMinutes <= 0) {
            throw new code_error_1.InvalidExpirationTimeError();
        }
        this._value = this.generateCode();
        this._expiresIn = Date.now() + this.minutesToMiliseconds(expirationTimeInMinutes);
    }
    minutesToMiliseconds(minutes) {
        return minutes * this.SECONDS_IN_A_MINUTE * this.MILISECONDS_IN_A_SECOND;
    }
    generateCode() {
        const characters = '0123456789';
        const charactersLength = characters.length;
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
exports.Code = Code;
//# sourceMappingURL=code.vo.js.map