import { AppException } from 'src/core/filters/app.exception';

export class ResaleIdAlreadyTakenError extends AppException {
  constructor(id: number) {
    super(`O id ${id} já está em uso.`, 409);
    this.name = 'ResaleIdAlreadyTakenError';
  }
}
