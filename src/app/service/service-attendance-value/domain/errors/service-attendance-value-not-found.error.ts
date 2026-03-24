import { AppException } from 'src/core/filters/app.exception';

export class ServiceAttendanceValueNotFoundError extends AppException {
  constructor() {
    super('Valor de atendimento de serviço não encontrado na base de dados.', 404);
    this.name = 'ServiceAttendanceValueNotFoundError';
  }
}
