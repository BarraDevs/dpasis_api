"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phone = void 0;
const phone_error_1 = require("./phone.error");
class Phone {
    _value;
    get value() {
        return this._value;
    }
    constructor(phone) {
        if (!this.validate(phone)) {
            throw new phone_error_1.InvalidPhoneError();
        }
        this._value = this.sanitize(phone);
    }
    validate(phone) {
        if (!phone)
            return false;
        const length = this.sanitize(phone).length;
        return length === 10 || length === 11;
    }
    sanitize(phone) {
        return phone.replace(/\D/g, '');
    }
}
exports.Phone = Phone;
//# sourceMappingURL=phone.vo.js.map