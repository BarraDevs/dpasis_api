import { AppException } from 'src/core/filters/app.exception';

export class ClientAttachmentLinkSharedError extends AppException {
  constructor() {
    super('Não é possível excluir o anexo pois a mesma URL está vinculada a outro registro.', 409);
    this.name = 'ClientAttachmentLinkSharedError';
  }
}
