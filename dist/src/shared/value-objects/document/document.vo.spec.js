"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const document_error_1 = require("./document.error");
const document_vo_1 = require("./document.vo");
describe('Document Value Object', () => {
    it('should not throw an error when providing a valid cpf', () => {
        const document = new document_vo_1.Document('820.670.530-94');
        expect(document.value).toBe('82067053094');
    });
    it('should not throw an error when providing a valid cnpj', () => {
        const document = new document_vo_1.Document('28.695.096/0001-79');
        expect(document.value).toBe('28695096000179');
    });
    it('should throw an error when providing an invalid document', () => {
        expect(() => new document_vo_1.Document('123')).toThrow('CPF/CNPJ inválido');
        expect(() => new document_vo_1.Document('123')).toThrow(document_error_1.InvalidDocumentError);
    });
    it('should throw an error when providing an invalid cpf', () => {
        expect(() => new document_vo_1.Document('123.456.789-00')).toThrow('CPF inválido');
        expect(() => new document_vo_1.Document('123')).toThrow(document_error_1.InvalidDocumentError);
    });
    it('should throw an error when providing an invalid cnpj', () => {
        expect(() => new document_vo_1.Document('12.345.678/0001-00')).toThrow('CNPJ inválido');
        expect(() => new document_vo_1.Document('123')).toThrow(document_error_1.InvalidDocumentError);
    });
});
//# sourceMappingURL=document.vo.spec.js.map