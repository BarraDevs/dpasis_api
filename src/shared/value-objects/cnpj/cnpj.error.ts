export class InvalidCnpjError extends Error {
  constructor() {
    super('CNPJ inválido');
    this.name = 'InvalidCnpjError';
  }
}
