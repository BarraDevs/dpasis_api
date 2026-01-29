import { BadRequestException } from '@nestjs/common';

export class InvalidItemTypeError extends BadRequestException {
  constructor() {
    super('Tipo de item inválido. Deve ser PRODUCT ou SERVICE;');
  }
}
