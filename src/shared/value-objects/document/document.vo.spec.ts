import { InvalidDocumentError } from './document.error';
import { Document } from './document.vo';

describe('Document Value Object', () => {
  describe('valid documents', () => {
    it('should not throw an error when providing a valid cpf', () => {
      const document = new Document('820.670.530-94');
      expect(document.value).toBe('82067053094');
    });

    it('should not throw an error when providing a valid cnpj', () => {
      const document = new Document('28.695.096/0001-79');
      expect(document.value).toBe('28695096000179');
    });

    it('should sanitize and return only digits for valid cpf', () => {
      const document = new Document('974.563.215-58');
      expect(document.value).toBe('97456321558');
    });

    it('should sanitize and return only digits for valid cnpj', () => {
      const document = new Document('09.748.165/0001-10');
      expect(document.value).toBe('09748165000110');
    });
  });

  describe('empty or whitespace-only (new verification)', () => {
    it.each([
      ['', 'empty string'],
      ['   ', 'whitespace only'],
      ['\t\n', 'tabs and newlines'],
      ['...', 'dots only'],
      ['---', 'dashes only'],
      [' . - ', 'mixed separators only'],
      ['...---   ', 'dots, dashes and spaces'],
    ])('should throw InvalidDocumentError when document is empty after sanitize (%s)', (raw: string) => {
      expect(() => new Document(raw)).toThrow(InvalidDocumentError);
      expect(() => new Document(raw)).toThrow('CPF/CNPJ inválido');
    });

    it('should include original value in error message when empty', () => {
      expect(() => new Document('')).toThrow('CPF/CNPJ inválido: ');
      expect(() => new Document('   ')).toThrow('CPF/CNPJ inválido:    ');
    });
  });

  describe('invalid document length', () => {
    it('should throw InvalidDocumentError when document has wrong length', () => {
      expect(() => new Document('123')).toThrow('CPF/CNPJ inválido: 123');
      expect(() => new Document('123')).toThrow(InvalidDocumentError);
    });

    it('should throw InvalidDocumentError when document has less than 11 digits', () => {
      expect(() => new Document('1234567890')).toThrow(InvalidDocumentError);
    });

    it('should throw InvalidDocumentError when document has 12 or 13 digits', () => {
      expect(() => new Document('123456789012')).toThrow(InvalidDocumentError);
      expect(() => new Document('1234567890123')).toThrow(InvalidDocumentError);
    });

    it('should throw InvalidDocumentError when document has more than 14 digits', () => {
      expect(() => new Document('123456789012345')).toThrow(InvalidDocumentError);
    });
  });

  describe('invalid cpf/cnpj format', () => {
    it('should throw when providing an invalid cpf', () => {
      expect(() => new Document('123.456.789-00')).toThrow('CPF inválido');
    });

    it('should throw when providing an invalid cnpj', () => {
      expect(() => new Document('12.345.678/0001-00')).toThrow('CNPJ inválido');
    });
  });
});
