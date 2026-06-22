import { Inject, Injectable } from '@nestjs/common';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { CarrierDto } from '../../dtos/carrier.dto';
import type { ICarrierDao } from '../../persistence/dao/carrier-dao.interface';

@Injectable()
export class FindCarrierById {
  constructor(
    @Inject(TOKENS.CarrierDao) private readonly carrierDao: ICarrierDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<CarrierDto> {
    const result = await this.carrierDao.findById(id);
    if (!result) {
      throw new CarrierNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new CarrierNotFoundError();
    }

    return result;
  }
}
