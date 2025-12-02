import { Inject, Injectable } from '@nestjs/common';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SupplierDto } from '../../dtos/supplier.dto';
import type { ISupplierDao } from '../../persistence/dao/supplier-dao.interface';

@Injectable()
export class FindSupplierById {
  constructor(
    @Inject(TOKENS.SupplierDao) private readonly supplierDao: ISupplierDao
  ) {}

  public async execute(id: string): Promise<SupplierDto> {
    const supplier = await this.supplierDao.findById(id);
    if (!supplier) {
      throw new SupplierNotFoundError();
    }

    return supplier;
  }
}
