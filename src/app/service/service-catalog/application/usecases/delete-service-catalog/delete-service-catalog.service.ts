import { Inject, Injectable } from '@nestjs/common';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceCatalogDao } from '../../persistence/dao/service-catalog-dao.interface';
import type { IServiceCatalogRepository } from '../../persistence/repository/service-catalog-repository.interface';

@Injectable()
export class DeleteServiceCatalog {
  constructor(
    @Inject(TOKENS.ServiceCatalogDao) private readonly serviceCatalogDao: IServiceCatalogDao,
    @Inject(TOKENS.ServiceCatalogRepository) private readonly serviceCatalogRepository: IServiceCatalogRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.serviceCatalogDao.findById(id);
    if (!existing) {
      throw new ServiceCatalogNotFoundError();
    }

    await this.serviceCatalogRepository.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
