import { Inject, Injectable } from '@nestjs/common';
import { BilledInUseError } from 'src/app/global/billed/domain/errors/billed-in-use.error';
import { BilledNotFoundError } from 'src/app/global/billed/domain/errors/billed-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBilledDao } from '../../persistence/dao/billed-dao.interface';
import type { IBilledRepository } from '../../persistence/repository/billed-repository.interface';

@Injectable()
export class DeleteBilled {
  constructor(
    @Inject(TOKENS.BilledDao) private readonly billedDao: IBilledDao,
    @Inject(TOKENS.BilledRepository) private readonly billedRepository: IBilledRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.billedDao.findById(id);
    if (!existing) {
      throw new BilledNotFoundError();
    }

    const servicesCount = await this.billedDao.countServicesByBilledId(id);
    if (servicesCount > 0) {
      throw new BilledInUseError();
    }

    await this.billedRepository.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
