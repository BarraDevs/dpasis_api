export class InvalidDocumentError extends Error {
  constructor() {
    super('CPF/CNPJ inválido');
    this.name = 'InvalidDocumentError';
  }
}
