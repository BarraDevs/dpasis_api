import { AppException } from 'src/core/filters/app.exception';

export class FileTooBigError extends AppException {
  constructor(sizeInMegabytes: number) {
    super(`Tamanho do arquivo excedido. O arquivo deve ter no máximo ${sizeInMegabytes} megabytes.`, 400);
    this.name = 'FileTooBigError';
  }
}
