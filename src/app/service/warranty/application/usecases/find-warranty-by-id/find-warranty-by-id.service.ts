import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import { WarrantyDto } from '../../dtos/warranty.dto';
import type { IWarrantyDao } from '../../persistence/dao/warranty-dao.interface';

@Injectable()
export class FindWarrantyById {
  constructor(
    @Inject(TOKENS.WarrantyDao) private readonly warrantyDao: IWarrantyDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<WarrantyDto> {
    const warranty = await this.warrantyDao.findById(id);
    if (!warranty) {
      throw new WarrantyNotFoundError();
    }
    if (options.onlyActive && !warranty.active) {
      throw new WarrantyNotFoundError();
    }

    return warranty;
  }
}
