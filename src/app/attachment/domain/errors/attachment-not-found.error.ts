import { AppException } from 'src/core/filters/app.exception';

export class AttachmentNotFoundError extends AppException {
  constructor() {
    super('Anexo não encontrado na base de dados', 404);
    this.name = 'AttachmentNotFoundError';
  }
}
