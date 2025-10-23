export class InvalidPhoneError extends Error {
  constructor() {
    super('Telefone inválido');
    this.name = 'InvalidPhoneError';
  }
}
