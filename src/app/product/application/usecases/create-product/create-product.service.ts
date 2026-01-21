import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { ProductDuplicateEanError } from 'src/app/product/domain/errors/duplicate-ean.error';
import { FindSupplierById } from 'src/app/supplier/application/usecases/find-supplier-by-id/find-supplier-by-id.service';
import { SupplierNotActiveError } from 'src/app/supplier/domain/errors/supplier-not-active.error';
import { TOKENS } from 'src/core/di/token';
import type { IProductDao } from '../../persistence/dao/product-dao.interface';
import type { IProductRepository } from '../../persistence/repository/product-repository.interface';
import { CreateProductInputDto, CreateProductOutputDto } from './dtos/create-product.dto';

@Injectable()
export class CreateProduct {
  constructor(
    @Inject(TOKENS.ProductRepository) private readonly productRepo: IProductRepository,
    @Inject(TOKENS.ProductDao) private readonly productDao: IProductDao,
    private readonly findCompanyById: FindCompanyById,
    private readonly findSupplierById: FindSupplierById,
  ) {}

  public async execute(data: CreateProductInputDto): Promise<CreateProductOutputDto> {
    // Verify if company exists
    const company = await this.findCompanyById.execute(data.companyId);
    if (!company.active) {
      throw new CompanyNotActiveError(company.fantasyName);
    }

    // Verify if product ean already exists in the company
    const existingProduct = await this.productDao.findByEan(data.ean, data.companyId);
    if (existingProduct) {
      throw new ProductDuplicateEanError();
    }

    // Verify if each supplier exists
    const suppliers = await Promise.all(
      data.supplierIds.map(
        async(supplierId) => this.findSupplierById.execute(supplierId),
      ),
    );
    suppliers.forEach((supplier) => {
      if (!supplier.active) {
        throw new SupplierNotActiveError(supplier.fantasyName);
      }
    });

    const product = Product.create({ ...data, companyId: company.id });

    await this.productRepo.save(product);

    return { id: product.props.id };
  }
}
