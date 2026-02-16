import { AppException } from 'src/core/filters/app.exception';

export class InvalidAccountRoleError extends AppException {
  constructor(role: string) {
    super(`Role inválido - ${role}`, 400);
    this.name = 'InvalidAccountRoleError';
  }
}
