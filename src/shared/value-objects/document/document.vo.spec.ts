import { InvalidDocumentError } from './document.error';
import { Document } from './document.vo';

describe('Document Value Object', () => {
  it('should not throw an error when providing a valid cpf', () => {
    const document = new Document('820.670.530-94');
    expect(document.value).toBe('82067053094');
  });

  it('should not throw an error when providing a valid cnpj', () => {
    const document = new Document('28.695.096/0001-79');
    expect(document.value).toBe('28695096000179');
  });

  it('should throw an error when providing an invalid document', () => {
    expect(() => new Document('123')).toThrow('CPF/CNPJ inválido');
    expect(() => new Document('123')).toThrow(InvalidDocumentError);
  });

  it('should throw an error when providing an invalid cpf', () => {
    expect(() => new Document('123.456.789-00')).toThrow('CPF inválido');
    expect(() => new Document('123')).toThrow(InvalidDocumentError);
  });

  it('should throw an error when providing an invalid cnpj', () => {
    expect(() => new Document('12.345.678/0001-00')).toThrow('CNPJ inválido');
    expect(() => new Document('123')).toThrow(InvalidDocumentError);
  });
});
