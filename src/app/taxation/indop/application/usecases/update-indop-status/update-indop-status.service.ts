import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { IndopNotFoundError } from '../../../domain/errors/indop-not-found.error';
import type { IIndopDao } from '../../persistence/dao/indop-dao.interface';

@Injectable()
export class UpdateIndopStatus {
  constructor(
    @Inject(TOKENS.IndopDao) private readonly indopDao: IIndopDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const indop = await this.indopDao.findById(id);
    if (!indop) {
      throw new IndopNotFoundError();
    }

    await this.indopDao.updateStatus(id, !indop.active);

    return { message: 'Status do INDOP atualizado com sucesso' };
  }
}
