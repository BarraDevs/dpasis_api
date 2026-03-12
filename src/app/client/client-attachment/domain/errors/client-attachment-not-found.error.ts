import { AppException } from 'src/core/filters/app.exception';

export class ClientAttachmentNotFoundError extends AppException {
  constructor() {
    super('Anexo do cliente não encontrado na base de dados.', 404);
    this.name = 'ClientAttachmentNotFoundError';
  }
}
