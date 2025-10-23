export class InvalidAccountStatusError extends Error {
  constructor(status: string) {
    super(`Status inválido - ${status}`);
    this.name = 'InvalidAccountStatusError';
  }
}

export class InvalidAccountRolesError extends Error {
  constructor(roles: string[]) {
    super(`Roles inválidos - ${roles.join(', ')}`);
    this.name = 'InvalidAccountRolesError';
  }
}
