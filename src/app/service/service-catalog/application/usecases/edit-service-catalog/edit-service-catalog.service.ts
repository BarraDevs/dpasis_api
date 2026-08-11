import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { FindBilledById } from 'src/app/global/billed/application/usecases/find-billed-by-id/find-billed-by-id.service';
import { FindCategoryById } from 'src/app/global/category/application/usecases/find-category-by-id/find-category-by-id.service';
import { FindDeliveryTermById } from 'src/app/global/delivery-term/application/usecases/find-delivery-term-by-id/find-delivery-term-by-id.service';
import { FindFreightById } from 'src/app/global/freight/application/usecases/find-freight-by-id/find-freight-by-id.service';
import { FindProposalValidityById } from 'src/app/global/proposal-validity/application/usecases/find-proposal-validity-by-id/find-proposal-validity-by-id.service';
import { FindCnaeNbsIndopById } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-cnae-nbs-indop-by-id/find-cnae-nbs-indop-by-id.service';
import { FindWarrantyById } from 'src/app/global/warranty/application/usecases/find-warranty-by-id/find-warranty-by-id.service';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { ServiceCatalogFactory } from 'src/app/service/service-catalog/domain/factories/service-catalog.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceCatalogDao } from '../../persistence/dao/service-catalog-dao.interface';
import type { IServiceCatalogRepository } from '../../persistence/repository/service-catalog-repository.interface';
import { EditServiceCatalogInputDto } from './dtos/edit-service-catalog.dto';

@Injectable()
export class EditServiceCatalog {
  constructor(
    @Inject(TOKENS.ServiceCatalogDao) private readonly serviceCatalogDao: IServiceCatalogDao,
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

  public async execute(id: number, data: EditServiceCatalogInputDto): Promise<SuccessMessage> {
    const existing = await this.serviceCatalogDao.findById(id);
    if (!existing) {
      throw new ServiceCatalogNotFoundError();
    }

    await this.validateActiveForeignKeysIfProvided(data);

    const companyIds =
      data.companyIds !== undefined ? data.companyIds : (existing.companies ?? []).map((c) => c.id);

    const entity = ServiceCatalogFactory.edit({
      cnaeNbsIndopId: data.cnaeNbsIndopId ?? existing.cnaeNbsIndop.id,
      billedId: data.billedId ?? existing.billed.id,
      categoryId: data.categoryId ?? existing.category.id,
      deliveryTermId: data.deliveryTermId ?? existing.deliveryTerm.id,
      freightId: data.freightId ?? existing.freight.id,
      proposalValidityId: data.proposalValidityId ?? existing.proposalValidity.id,
      warrantyId: data.warrantyId ?? existing.warranty.id,
      companyIds,
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
      tasks.push(this.findCnaeNbsIndopById.execute(data.cnaeNbsIndopId, { onlyActive: true }));
    }
    if (data.billedId !== undefined) {
      tasks.push(this.findBilledById.execute(data.billedId, { onlyActive: true }));
    }
    if (data.categoryId !== undefined) {
      tasks.push(this.findCategoryById.execute(data.categoryId, { onlyActive: true }));
    }
    if (data.deliveryTermId !== undefined) {
      tasks.push(this.findDeliveryTermById.execute(data.deliveryTermId, { onlyActive: true }));
    }
    if (data.freightId !== undefined) {
      tasks.push(this.findFreightById.execute(data.freightId, { onlyActive: true }));
    }
    if (data.proposalValidityId !== undefined) {
      tasks.push(this.findProposalValidityById.execute(data.proposalValidityId, { onlyActive: true }));
    }
    if (data.warrantyId !== undefined) {
      tasks.push(this.findWarrantyById.execute(data.warrantyId, { onlyActive: true }));
    }
    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
    if (data.companyIds) {
      for (const companyId of data.companyIds) {
        await this.findCompanyById.execute(companyId, { onlyActive: true });
      }
    }
  }
}
