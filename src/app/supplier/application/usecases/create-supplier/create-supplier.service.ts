import { Inject, Injectable } from '@nestjs/common';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
import { SupplierDuplicateIeError } from 'src/app/supplier/domain/errors/duplicate-ie.error';
import { TOKENS } from 'src/core/di/token';
import type { ISupplierDao } from '../../persistence/dao/supplier-dao.interface';
import type { ISupplierRepository } from '../../persistence/repository/supplier-repository.interface';
import { CreateSupplierInputDto, CreateSupplierOutputDto } from './dtos/create-supplier.dto';

@Injectable()
export class CreateSupplier {
  constructor(
    @Inject(TOKENS.SupplierDao) private readonly supplierDao: ISupplierDao,
    @Inject(TOKENS.SupplierRepository) private readonly supplierRepository: ISupplierRepository,
  ) {}

  public async execute(data: CreateSupplierInputDto): Promise<CreateSupplierOutputDto> {
    const duplicateCnpj = await this.supplierDao.findByCnpj(data.cnpj);
    if (duplicateCnpj) {
      throw new SupplierDuplicateCnpjError();
    }
    const duplicateIe = await this.supplierDao.findByIe(data.ie);
    if (duplicateIe) {
      throw new SupplierDuplicateIeError();
    }

    const supplier = Supplier.create(data);
    await this.supplierRepository.save(supplier);

    return { id: supplier.props.id };
  }
}
