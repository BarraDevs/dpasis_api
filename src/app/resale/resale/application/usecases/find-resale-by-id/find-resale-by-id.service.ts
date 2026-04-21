import { Inject, Injectable } from '@nestjs/common';
import { ResaleDto } from 'src/app/resale/resale/application/dtos/resale.dto';
import { ResaleNotFoundError } from 'src/app/resale/resale/domain/errors/resale-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import type { IResaleDao } from '../../persistence/dao/resale-dao.interface';

@Injectable()
export class FindResaleById {
  constructor(
    @Inject(TOKENS.ResaleDao) private readonly resaleDao: IResaleDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ResaleDto> {
    const result = await this.resaleDao.findById(id);
    if (!result) {
      throw new ResaleNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new ResaleNotFoundError();
    }

    return result;
  }
}
