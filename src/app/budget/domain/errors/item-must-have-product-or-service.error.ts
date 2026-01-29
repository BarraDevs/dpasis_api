import { BadRequestException } from '@nestjs/common';

export class ItemMustHaveProductOrServiceError extends BadRequestException {
  constructor() {
    super('O item deve ter um produto ou um serviço vinculado (nunca ambos).');
  }
}
