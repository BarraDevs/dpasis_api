export class InvalidExpirationTimeError extends Error {
  constructor() {
    super('Tempo de expiração inválido');
    this.name = 'InvalidExpirationTimeError';
  }
}
