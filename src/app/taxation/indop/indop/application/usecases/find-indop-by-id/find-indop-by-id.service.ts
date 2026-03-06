import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { IndopNotFoundError } from '../../../domain/errors/indop-not-found.error';
import { IndopDto } from '../../dtos/indop.dto';
import type { IIndopDao } from '../../persistence/dao/indop-dao.interface';

@Injectable()
export class FindIndopById {
  constructor(
    @Inject(TOKENS.IndopDao) private readonly indopDao: IIndopDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<IndopDto> {
    const indop = await this.indopDao.findById(id);
    if (!indop) {
      throw new IndopNotFoundError();
    }
    if (options.onlyActive && !indop.active) {
      throw new IndopNotFoundError();
    }

    return indop;
  }
}
