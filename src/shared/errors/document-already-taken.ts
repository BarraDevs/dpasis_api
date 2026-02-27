import { AppException } from 'src/core/filters/app.exception';

export class DocumentAlreadyTakenError extends AppException {
  constructor(document: string) {
    super(`O documento ${document} já está em uso.`, 409);
    this.name = 'DocumentAlreadyTakenError';
  }
}
