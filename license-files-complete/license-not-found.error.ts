TypeScript

import { AppException } from 'src/core/filters/app.exception';

export class LicenseNotFoundError extends AppException {
  constructor() {
    super('Licença não encontrada na base de dados', 404);
    this.name = 'LicenseNotFoundError';
  }
}
4. Módulo e Controller
Agora, vamos habilitar todos os serviços no módulo e no controller.
