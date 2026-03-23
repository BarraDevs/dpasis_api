import { AppException } from 'src/core/filters/app.exception';

export class ClientAttendanceTypeInUseError extends AppException {
  constructor() {
    super('Não é possível excluir pois existem tipos de cliente vinculados.', 409);
    this.name = 'ClientAttendanceTypeInUseError';
  }
}
