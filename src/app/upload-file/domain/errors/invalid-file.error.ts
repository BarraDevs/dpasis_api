import { AppException } from 'src/core/filters/app.exception';

export class InvalidFileError extends AppException {
  constructor(mimeTypes: string[]) {
    super(`Tipo de arquivo inválido. O arquivo deve ser um dos seguintes tipos: ${mimeTypes.join(', ')}.`, 400);
    this.name = 'InvalidFileError';
  }
}
