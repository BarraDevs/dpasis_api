"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppException = void 0;
class AppException extends Error {
    _code;
    constructor(message, code) {
        super(message);
        this._code = code;
    }
    get code() {
        return this._code;
    }
}
exports.AppException = AppException;
//# sourceMappingURL=app.exception.js.map