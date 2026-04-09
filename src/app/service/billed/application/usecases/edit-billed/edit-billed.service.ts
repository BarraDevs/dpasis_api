import { Inject, Injectable } from '@nestjs/common';
import { BilledNotFoundError } from 'src/app/service/billed/domain/errors/billed-not-found.error';
import { BilledFactory } from 'src/app/service/billed/domain/factories/billed.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBilledDao } from '../../persistence/dao/billed-dao.interface';
import type { IBilledRepository } from '../../persistence/repository/billed-repository.interface';
import { EditBilledInputDto } from './dtos/edit-billed.dto';

@Injectable()
export class EditBilled {
  constructor(
    @Inject(TOKENS.BilledDao) private readonly billedDao: IBilledDao,
    @Inject(TOKENS.BilledRepository) private readonly billedRepository: IBilledRepository,
  ) {}

  public async execute(id: number, data: EditBilledInputDto): Promise<SuccessMessage> {
    const existing = await this.billedDao.findById(id);
    if (!existing) {
      throw new BilledNotFoundError();
    }

    const entity = BilledFactory.edit({
      ...existing,
      ...data,
    });

    await this.billedRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
