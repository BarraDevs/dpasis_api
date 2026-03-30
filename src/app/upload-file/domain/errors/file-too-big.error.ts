import { AppException } from 'src/core/filters/app.exception';

export class FileTooBigError extends AppException {
  constructor(sizeInMegabytes: number) {
    super(`Tamanho do arquivo excedido. O arquivo deve ter no máximo ${sizeInMegabytes}MB.`, 400);
    this.name = 'FileTooBigError';
  }
}
