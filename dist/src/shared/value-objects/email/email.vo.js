"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const email_error_1 = require("./email.error");
class Email {
    _value;
    get value() {
        return this._value;
    }
    constructor(email) {
        if (!this.validate(email)) {
            throw new email_error_1.InvalidEmailError();
        }
        this._value = email;
    }
    validate(email) {
        const regex = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
        return regex.test(email);
    }
}
exports.Email = Email;
//# sourceMappingURL=email.vo.js.map