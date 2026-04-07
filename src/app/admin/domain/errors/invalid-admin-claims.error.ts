import { AppException } from 'src/core/filters/app.exception';

export class InvalidAdminClaimsError extends AppException {
  constructor() {
    super('Uma ou mais permissões informadas são inválidas.', 400);
    this.name = 'InvalidAdminClaimsError';
  }
}
