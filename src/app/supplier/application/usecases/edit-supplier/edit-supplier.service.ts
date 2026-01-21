import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import type { ISupplierDao } from '../../persistence/dao/supplier-dao.interface';
import type { ISupplierRepository } from '../../persistence/repository/supplier-repository.interface';
import { EditSupplierInputDto } from './dtos/edit-supplier.dto';

@Injectable()
export class EditSupplier {
  constructor(
    @Inject(TOKENS.SupplierDao) private readonly supplierDao: ISupplierDao,
    @Inject(TOKENS.SupplierRepository) private readonly supplierRepository: ISupplierRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(id: string, data: EditSupplierInputDto): Promise<SuccessMessage> {
    const supplierData = await this.supplierDao.findById(id);
    if (!supplierData) {
      throw new SupplierNotFoundError();
    }

    const supplier = Supplier.load({
      ...supplierData,
      ...data,
      companyIds: data.companyIds ?? supplierData.companies.map((company) => company.id),
      updatedAt: UTCDate.create().value,
    });

    if (data.cnpj && supplier.props.cnpj !== supplierData.cnpj) {
      const existingSupplierWithCnpj = await this.supplierDao.findByCnpj(supplier.props.cnpj);
      if (existingSupplierWithCnpj) {
        throw new SupplierDuplicateCnpjError();
      }
    }

    if (data.companyIds) {
      await Promise.all(
        supplier.props.companyIds.map(
          async(companyId) => this.findCompanyById.execute(companyId),
        ),
      );
    }

    await this.supplierRepository.edit(supplier);

    return { message: 'Fornecedor editado com sucesso!' };
  }
}
