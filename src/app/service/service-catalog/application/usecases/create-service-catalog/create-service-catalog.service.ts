import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { FindBilledById } from 'src/app/global/billed/application/usecases/find-billed-by-id/find-billed-by-id.service';
import { FindCategoryById } from 'src/app/global/category/application/usecases/find-category-by-id/find-category-by-id.service';
import { FindDeliveryTermById } from 'src/app/global/delivery-term/application/usecases/find-delivery-term-by-id/find-delivery-term-by-id.service';
import { FindFreightById } from 'src/app/global/freight/application/usecases/find-freight-by-id/find-freight-by-id.service';
import { FindProposalValidityById } from 'src/app/global/proposal-validity/application/usecases/find-proposal-validity-by-id/find-proposal-validity-by-id.service';
import { FindCnaeNbsIndopById } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-cnae-nbs-indop-by-id/find-cnae-nbs-indop-by-id.service';
import { FindWarrantyById } from 'src/app/global/warranty/application/usecases/find-warranty-by-id/find-warranty-by-id.service';
import { ServiceCatalogFactory } from 'src/app/service/service-catalog/domain/factories/service-catalog.factory';
import { TOKENS } from 'src/core/di/token';
import type { IServiceCatalogRepository } from '../../persistence/repository/service-catalog-repository.interface';
import { CreateServiceCatalogInputDto, CreateServiceCatalogOutputDto } from './dtos/create-service-catalog.dto';

@Injectable()
export class CreateServiceCatalog {
  constructor(
    @Inject(TOKENS.ServiceCatalogRepository) private readonly serviceCatalogRepository: IServiceCatalogRepository,
    private readonly findCnaeNbsIndopById: FindCnaeNbsIndopById,
    private readonly findBilledById: FindBilledById,
    private readonly findCategoryById: FindCategoryById,
    private readonly findDeliveryTermById: FindDeliveryTermById,
    private readonly findFreightById: FindFreightById,
    private readonly findProposalValidityById: FindProposalValidityById,
    private readonly findWarrantyById: FindWarrantyById,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateServiceCatalogInputDto): Promise<CreateServiceCatalogOutputDto> {
    await Promise.all([
      this.findCnaeNbsIndopById.execute(data.cnaeNbsIndopId, { onlyActive: true }),
      this.findBilledById.execute(data.billedId, { onlyActive: true }),
      this.findCategoryById.execute(data.categoryId, { onlyActive: true }),
      this.findDeliveryTermById.execute(data.deliveryTermId, { onlyActive: true }),
      this.findFreightById.execute(data.freightId, { onlyActive: true }),
      this.findProposalValidityById.execute(data.proposalValidityId, { onlyActive: true }),
      this.findWarrantyById.execute(data.warrantyId, { onlyActive: true }),
    ]);

    for (const companyId of data.companyIds) {
      await this.findCompanyById.execute(companyId, { onlyActive: true });
    }

    const entity = ServiceCatalogFactory.create(data);

    const id = await this.serviceCatalogRepository.save(entity);

    return { id };
  }
}
