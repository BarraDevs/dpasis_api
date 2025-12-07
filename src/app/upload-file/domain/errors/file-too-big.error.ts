import { AppException } from 'src/core/filters/app.exception';

export class FileTooBigError extends AppException {
  constructor() {
    super('Tamanho do arquivo excedido. O arquivo deve ter no máximo 20MB.', 400);
  }
}
