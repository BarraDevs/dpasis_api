import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
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
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateSupplierInputDto): Promise<CreateSupplierOutputDto> {
    const supplier = Supplier.create(data);

    const duplicateCnpj = await this.supplierDao.findByCnpj(supplier.props.cnpj);
    if (duplicateCnpj) {
      throw new SupplierDuplicateCnpjError();
    }

    // Verify if each company exists
    await Promise.all(
      supplier.props.companyIds.map(
        async(companyId) => this.findCompanyById.execute(companyId),
      ),
    );

    await this.supplierRepository.save(supplier);

    return { id: supplier.props.id };
  }
}
