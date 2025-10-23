export class ForbiddenAccountError extends Error {
  constructor() {
    super('Acesso negado.');
    this.name = 'ForbiddenAccountError';
  }
}
