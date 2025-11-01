import { AppException } from 'src/core/filters/app.exception';

export class InvalidAccountStatusError extends AppException {
  constructor(status: string) {
    super(`Status inválido - ${status}`, 400);
    this.name = 'InvalidAccountStatusError';
  }
}

export class InvalidAccountRolesError extends AppException {
  constructor(roles: string[]) {
    super(`Roles inválidos - ${roles.join(', ')}`, 400);
    this.name = 'InvalidAccountRolesError';
  }
}
