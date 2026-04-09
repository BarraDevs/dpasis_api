import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { WarrantyAlreadyExistsError } from '../../../domain/errors/warranty-already-exists.error';
import type { IWarrantyDao } from '../../persistence/dao/warranty-dao.interface';
import { CreateWarrantyInputDto, CreateWarrantyOutputDto } from './dtos/create-warranty.dto';

@Injectable()
export class CreateWarranty {
  constructor(
    @Inject(TOKENS.WarrantyDao) private readonly warrantyDao: IWarrantyDao,
  ) {}

  public async execute(data: CreateWarrantyInputDto): Promise<CreateWarrantyOutputDto> {
    const existing = await this.warrantyDao.findByName(data.name.trim());
    if (existing) {
      throw new WarrantyAlreadyExistsError(data.name);
    }

    const id = await this.warrantyDao.save(data);
    return { id };
  }
}
