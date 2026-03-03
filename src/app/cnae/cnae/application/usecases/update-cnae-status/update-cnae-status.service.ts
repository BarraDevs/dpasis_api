import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import type { ICnaeDao } from '../../persistence/dao/cnae-dao.interface';

@Injectable()
export class UpdateCnaeStatus {
  constructor(
    @Inject(TOKENS.CnaeDao) private readonly cnaeDao: ICnaeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const cnae = await this.cnaeDao.findById(id);
    if (!cnae) {
      throw new CnaeNotFoundError();
    }

    await this.cnaeDao.updateStatus(id, !cnae.active);

    return { message: 'Status do CNAE atualizado com sucesso' };
  }
}
