export class InactiveAccountError extends Error {
  constructor() {
    super('A sua conta foi suspensa. Entre em contato com a administração para mais detalhes.');
    this.name = 'InactiveAccountError';
  }
}
