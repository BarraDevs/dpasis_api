import { AppException } from 'src/core/filters/app.exception';

export class ClientSequenceInvalidNextIdError extends AppException {
  constructor(nextId: number, maxId: number) {
    super(`O nextId ${nextId} é inválido. O maior ID de cliente existente é ${maxId}; o novo nextId deve ser maior que ${maxId}.`, 422);
    this.name = 'ClientSequenceInvalidNextIdError';
  }
}
