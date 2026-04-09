import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { IndopInUseError } from '../../../domain/errors/indop-in-use.error';
import { IndopNotFoundError } from '../../../domain/errors/indop-not-found.error';
import type { IIndopDao } from '../../persistence/dao/indop-dao.interface';

@Injectable()
export class DeleteIndop {
  constructor(
    @Inject(TOKENS.IndopDao) private readonly indopDao: IIndopDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.indopDao.findById(id);
    if (!existing) {
      throw new IndopNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.indopDao.countCnaeNbsIndopByIndopId(id),
    ]);
    if (inUse) {
      throw new IndopInUseError();
    }

    await this.indopDao.delete(id);
    return { message: 'INDOP excluído com sucesso.' };
  }
}
