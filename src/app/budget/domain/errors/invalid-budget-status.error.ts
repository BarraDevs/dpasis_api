import { BadRequestException } from '@nestjs/common';

export class InvalidBudgetStatusError extends BadRequestException {
  constructor(currentStatus: string, requiredStatus: string) {
    super(`Operação inválida. Status atual: ${currentStatus}. Status esperado: ${requiredStatus}.`);
  }
}
