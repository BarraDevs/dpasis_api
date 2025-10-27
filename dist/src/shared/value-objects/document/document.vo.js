"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const cnpj_vo_1 = require("../cnpj/cnpj.vo");
const cpf_vo_1 = require("../cpf/cpf.vo");
const document_error_1 = require("./document.error");
class Document {
    _value;
    get value() {
        return this._value;
    }
    constructor(raw) {
        const document = this.sanitize(raw);
        if (document.length === 11) {
            this._value = new cpf_vo_1.CPF(document).value;
        }
        else if (document.length === 14) {
            this._value = new cnpj_vo_1.CNPJ(document).value;
        }
        else {
            throw new document_error_1.InvalidDocumentError();
        }
    }
    sanitize(cnpj) {
        return cnpj?.replace(/[\s./-]*/gim, '');
    }
}
exports.Document = Document;
//# sourceMappingURL=document.vo.js.map