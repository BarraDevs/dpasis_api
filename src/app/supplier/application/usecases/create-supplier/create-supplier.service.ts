import { Inject, Injectable } from '@nestjs/common';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
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
    const supplier = Supplier.create(data);

    const duplicateCnpj = await this.supplierDao.findByCnpj(supplier.props.cnpj);
    if (duplicateCnpj) {
      throw new SupplierDuplicateCnpjError();
    }

    await this.supplierRepository.save(supplier);

    return { id: supplier.props.id };
  }
}
