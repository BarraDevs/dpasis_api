import { Inject, Injectable } from '@nestjs/common';
import { FindServiceBilledById } from 'src/app/service/service-billed/application/usecases/find-service-billed-by-id/find-service-billed-by-id.service';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { ServiceCatalogFactory } from 'src/app/service/service-catalog/domain/factories/service-catalog.factory';
import { FindServiceCategoryById } from 'src/app/service/service-category/application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { FindServiceDeliveryTermById } from 'src/app/service/service-delivery-term/application/usecases/find-service-delivery-term-by-id/find-service-delivery-term-by-id.service';
import { FindServiceFreightById } from 'src/app/service/service-freight/application/usecases/find-service-freight-by-id/find-service-freight-by-id.service';
import { FindServiceProposalValidityById } from 'src/app/service/service-proposal-validity/application/usecases/find-service-proposal-validity-by-id/find-service-proposal-validity-by-id.service';
import { FindServiceWarrantyById } from 'src/app/service/service-warranty/application/usecases/find-service-warranty-by-id/find-service-warranty-by-id.service';
import { FindCnaeNbsIndopById } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-cnae-nbs-indop-by-id/find-cnae-nbs-indop-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceCatalogDao } from '../../persistence/dao/service-catalog-dao.interface';
import type { IServiceCatalogRepository } from '../../persistence/repository/service-catalog-repository.interface';
import { EditServiceCatalogInputDto } from './dtos/edit-service-catalog.dto';

const onlyActive = { onlyActive: true } as const;

@Injectable()
export class EditServiceCatalog {
  constructor(
    @Inject(TOKENS.ServiceCatalogDao) private readonly serviceCatalogDao: IServiceCatalogDao,
    @Inject(TOKENS.ServiceCatalogRepository) private readonly serviceCatalogRepository: IServiceCatalogRepository,
    private readonly findCnaeNbsIndopById: FindCnaeNbsIndopById,
    private readonly findServiceBilledById: FindServiceBilledById,
    private readonly findServiceCategoryById: FindServiceCategoryById,
    private readonly findServiceDeliveryTermById: FindServiceDeliveryTermById,
    private readonly findServiceFreightById: FindServiceFreightById,
    private readonly findServiceProposalValidityById: FindServiceProposalValidityById,
    private readonly findServiceWarrantyById: FindServiceWarrantyById,
  ) {}

  public async execute(id: number, data: EditServiceCatalogInputDto): Promise<SuccessMessage> {
    const existing = await this.serviceCatalogDao.findById(id);
    if (!existing) {
      throw new ServiceCatalogNotFoundError();
    }

    await this.validateActiveForeignKeysIfProvided(data);

    const entity = ServiceCatalogFactory.edit({
      cnaeNbsIndopId: data.cnaeNbsIndopId ?? existing.cnaeNbsIndopId,
      serviceBilledId: data.serviceBilledId ?? existing.serviceBilledId,
      serviceCategoryId: data.serviceCategoryId ?? existing.serviceCategoryId,
      serviceDeliveryTermId: data.serviceDeliveryTermId ?? existing.serviceDeliveryTermId,
      serviceFreightId: data.serviceFreightId ?? existing.serviceFreightId,
      serviceProposalValidityId: data.serviceProposalValidityId ?? existing.serviceProposalValidityId,
      serviceWarrantyId: data.serviceWarrantyId ?? existing.serviceWarrantyId,
      name: data.name ?? existing.name,
      unitPriceInCents: data.unitPriceInCents ?? existing.unitPriceInCents,
      description: data.description ?? existing.description,
      isCommercial: data.isCommercial ?? existing.isCommercial,
      id,
      active: existing.active,
    });

    await this.serviceCatalogRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }

  private async validateActiveForeignKeysIfProvided(data: EditServiceCatalogInputDto): Promise<void> {
    const tasks: Promise<unknown>[] = [];
    if (data.cnaeNbsIndopId !== undefined) {
      tasks.push(this.findCnaeNbsIndopById.execute(data.cnaeNbsIndopId, onlyActive));
    }
    if (data.serviceBilledId !== undefined) {
      tasks.push(this.findServiceBilledById.execute(data.serviceBilledId, onlyActive));
    }
    if (data.serviceCategoryId !== undefined) {
      tasks.push(this.findServiceCategoryById.execute(data.serviceCategoryId, onlyActive));
    }
    if (data.serviceDeliveryTermId !== undefined) {
      tasks.push(this.findServiceDeliveryTermById.execute(data.serviceDeliveryTermId, onlyActive));
    }
    if (data.serviceFreightId !== undefined) {
      tasks.push(this.findServiceFreightById.execute(data.serviceFreightId, onlyActive));
    }
    if (data.serviceProposalValidityId !== undefined) {
      tasks.push(this.findServiceProposalValidityById.execute(data.serviceProposalValidityId, onlyActive));
    }
    if (data.serviceWarrantyId !== undefined) {
      tasks.push(this.findServiceWarrantyById.execute(data.serviceWarrantyId, onlyActive));
    }
    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }
}
