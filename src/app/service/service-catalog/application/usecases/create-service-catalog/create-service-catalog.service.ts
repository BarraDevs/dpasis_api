import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { FindServiceBilledById } from 'src/app/service/service-billed/application/usecases/find-service-billed-by-id/find-service-billed-by-id.service';
import { ServiceCatalogFactory } from 'src/app/service/service-catalog/domain/factories/service-catalog.factory';
import { FindServiceCategoryById } from 'src/app/service/service-category/application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { FindServiceDeliveryTermById } from 'src/app/service/service-delivery-term/application/usecases/find-service-delivery-term-by-id/find-service-delivery-term-by-id.service';
import { FindServiceFreightById } from 'src/app/service/service-freight/application/usecases/find-service-freight-by-id/find-service-freight-by-id.service';
import { FindServiceProposalValidityById } from 'src/app/service/service-proposal-validity/application/usecases/find-service-proposal-validity-by-id/find-service-proposal-validity-by-id.service';
import { FindServiceWarrantyById } from 'src/app/service/service-warranty/application/usecases/find-service-warranty-by-id/find-service-warranty-by-id.service';
import { FindCnaeNbsIndopById } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-cnae-nbs-indop-by-id/find-cnae-nbs-indop-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IServiceCatalogRepository } from '../../persistence/repository/service-catalog-repository.interface';
import { CreateServiceCatalogInputDto, CreateServiceCatalogOutputDto } from './dtos/create-service-catalog.dto';

@Injectable()
export class CreateServiceCatalog {
  constructor(
    @Inject(TOKENS.ServiceCatalogRepository) private readonly serviceCatalogRepository: IServiceCatalogRepository,
    private readonly findCnaeNbsIndopById: FindCnaeNbsIndopById,
    private readonly findServiceBilledById: FindServiceBilledById,
    private readonly findServiceCategoryById: FindServiceCategoryById,
    private readonly findServiceDeliveryTermById: FindServiceDeliveryTermById,
    private readonly findServiceFreightById: FindServiceFreightById,
    private readonly findServiceProposalValidityById: FindServiceProposalValidityById,
    private readonly findServiceWarrantyById: FindServiceWarrantyById,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateServiceCatalogInputDto): Promise<CreateServiceCatalogOutputDto> {
    await Promise.all([
      this.findCnaeNbsIndopById.execute(data.cnaeNbsIndopId, { onlyActive: true }),
      this.findServiceBilledById.execute(data.serviceBilledId, { onlyActive: true }),
      this.findServiceCategoryById.execute(data.serviceCategoryId, { onlyActive: true }),
      this.findServiceDeliveryTermById.execute(data.serviceDeliveryTermId, { onlyActive: true }),
      this.findServiceFreightById.execute(data.serviceFreightId, { onlyActive: true }),
      this.findServiceProposalValidityById.execute(data.serviceProposalValidityId, { onlyActive: true }),
      this.findServiceWarrantyById.execute(data.serviceWarrantyId, { onlyActive: true }),
    ]);

    for (const companyId of data.companyIds) {
      await this.findCompanyById.execute(companyId, { onlyActive: true });
    }

    const entity = ServiceCatalogFactory.create(data);

    const id = await this.serviceCatalogRepository.save(entity);

    return { id };
  }
}
