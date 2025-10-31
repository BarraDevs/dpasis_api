import { Inject, Injectable } from '@nestjs/common';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
import { SupplierDuplicateIeError } from 'src/app/supplier/domain/errors/duplicate-ie.error';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISupplierDao } from '../../persistence/dao/supplier-dao.interface';
import type { ISupplierRepository } from '../../persistence/repository/supplier-repository.interface';
import { EditSupplierInputDto } from './dtos/edit-supplier.dto';

@Injectable()
export class EditSupplier {
  constructor(
    @Inject(TOKENS.SupplierDao) private readonly supplierDao: ISupplierDao,
    @Inject(TOKENS.SupplierRepository) private readonly supplierRepository: ISupplierRepository,
  ) {}

  public async execute(id: string, data: EditSupplierInputDto): Promise<SuccessMessage> {
    const supplierData = await this.supplierDao.findById(id);
    if (!supplierData) {
      throw new SupplierNotFoundError();
    }

    if (data.cnpj && data.cnpj !== supplierData.cnpj) {
      const existingSupplierWithCnpj = await this.supplierDao.findByCnpj(data.cnpj);
      if (existingSupplierWithCnpj) {
        throw new SupplierDuplicateCnpjError();
      }
    }

    if (data.ie && data.ie !== supplierData.ie) {
      const existingSupplierWithIe = await this.supplierDao.findByIe(data.ie);
      if (existingSupplierWithIe) {
        throw new SupplierDuplicateIeError();
      }
    }

    const supplier = Supplier.load({
      ...supplierData,
      ...data,
    });

    await this.supplierRepository.edit(supplier);

    return { message: 'Fornecedor editado com sucesso!' };
  }
}
