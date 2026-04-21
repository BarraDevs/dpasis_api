import { Inject, Injectable } from '@nestjs/common';
import { ResaleNotFoundError } from 'src/app/resale/resale/domain/errors/resale-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IResaleRepository } from '../../persistence/repository/resale-repository.interface';

@Injectable()
export class DeactivateResale {
  constructor(
    @Inject(TOKENS.ResaleRepository) private readonly resaleRepository: IResaleRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const resale = await this.resaleRepository.findById(id);
    if (!resale) {
      throw new ResaleNotFoundError();
    }

    resale.deactivate();
    await this.resaleRepository.edit(resale);

    return { message: 'Revenda desativada com sucesso' };
  }
}
