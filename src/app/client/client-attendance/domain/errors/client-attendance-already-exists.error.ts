import { AppException } from 'src/core/filters/app.exception';

export class ClientAttendanceAlreadyExistsError extends AppException {
  constructor(name: string) {
    super(`Já existe um atendimento de cliente com o nome: ${name}`, 409);
    this.name = 'ClientAttendanceAlreadyExistsError';
  }
}
