import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { FindProductById } from 'src/app/product/application/usecases/find-product-by-id/find-product-by-id.service';
import { FindServiceCategoryById } from 'src/app/service-category/application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { ServiceCategoryNotActiveError } from 'src/app/service-category/domain/errors/service-category-not-active.error';
import { Service } from 'src/app/service/domain/entities/service.entity';
import { TOKENS } from 'src/core/di/token';
import type { IServiceRepository } from '../../persistence/repository/service-repository.interface';
import { CreateServiceInputDto, CreateServiceOutputDto } from './dtos/create-service.dto';

@Injectable()
export class CreateService {
  constructor(
    @Inject(TOKENS.ServiceRepository) private readonly serviceRepository: IServiceRepository,
    private readonly findCompanyById: FindCompanyById,
    private readonly findServiceCategoryById: FindServiceCategoryById,
    private readonly findProductById: FindProductById,
  ) {}

  public async execute(data: CreateServiceInputDto): Promise<CreateServiceOutputDto> {
    const company = await this.findCompanyById.execute(data.companyId);
    if (!company.active) {
      throw new CompanyNotActiveError(company.fantasyName);
    }

    const serviceCategory = await this.findServiceCategoryById.execute(data.categoryId);
    if (!serviceCategory.active) {
      throw new ServiceCategoryNotActiveError();
    }

    await Promise.all(
      data.productIds.map((productId) => this.findProductById.execute(productId)),
    );

    // TODO: adicionar active na tabela Product
    // products.forEach((product) => {
    //   if ((product as { active?: boolean }).active === false) {
    //     throw new ProductNotActiveError();
    //   }
    // });

    const service = Service.create({
      ...data,
    });

    await this.serviceRepository.save(service);

    return { id: service.props.id };
  }
}
