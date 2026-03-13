import { AppException } from 'src/core/filters/app.exception';

export class ClientAttendanceTypeAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um tipo de atendimento de cliente com o nome: ${name}`, 409);
    this.name = 'ClientAttendanceTypeAlreadyExistsError';
  }
}
