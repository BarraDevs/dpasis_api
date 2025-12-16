import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { FindSupplierById } from 'src/app/supplier/application/usecases/find-supplier-by-id/find-supplier-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IProductRepository } from '../../persistence/repository/product-repository.interface';
import { CreateProductInputDto, CreateProductOutputDto } from './dtos/create-product.dto';

@Injectable()
export class CreateProduct {
  constructor(
    @Inject(TOKENS.ProductRepository) private readonly productRepo: IProductRepository,
    private readonly findCompanyById: FindCompanyById,
    private readonly findSupplierById: FindSupplierById,
  ) {}

  public async execute(data: CreateProductInputDto): Promise<CreateProductOutputDto> {
    // Verify if company exists
    const company = await this.findCompanyById.execute(data.companyId);

    // Verify if each supplier exists
    await Promise.all(
      data.supplierIds.map(
        async(supplierId) => this.findSupplierById.execute(supplierId),
      ),
    );

    const product = Product.create({ ...data, companyId: company.id });

    await this.productRepo.save(product);

    return { id: product.props.id };
  }
}
