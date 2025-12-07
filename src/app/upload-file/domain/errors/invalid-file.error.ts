import { AppException } from 'src/core/filters/app.exception';

export class InvalidFileError extends AppException {
  constructor() {
    super('Tipo de arquivo inválido. O arquivo deve ser uma imagem JPEG, PNG, WEBP ou JPG.', 400);
  }
}
