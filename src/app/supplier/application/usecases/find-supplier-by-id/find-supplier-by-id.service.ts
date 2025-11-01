import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SupplierDto } from '../../dtos/supplier.dto';
import type { ISupplierDao } from '../../persistence/dao/supplier-dao.interface';

@Injectable()
export class FindSupplierById {
  constructor(
    @Inject(TOKENS.SupplierDao) private supplierDao: ISupplierDao
  ) {}

  public async execute(id: string): Promise<SupplierDto | null> {
    return this.supplierDao.findById(id);
  }
}
