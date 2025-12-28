import { AppException } from 'src/core/filters/app.exception';

export class GenericUploadError extends AppException {
  constructor() {
    super('Erro ao fazer upload do arquivo. Tente novamente mais tarde', 422);
    this.name = 'GenericUploadError';
  }
}
