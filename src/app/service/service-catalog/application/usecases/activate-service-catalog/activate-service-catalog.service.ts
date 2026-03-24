import { Inject, Injectable } from '@nestjs/common';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceCatalogRepository } from '../../persistence/repository/service-catalog-repository.interface';

@Injectable()
export class ActivateServiceCatalog {
  constructor(
    @Inject(TOKENS.ServiceCatalogRepository) private readonly serviceCatalogRepository: IServiceCatalogRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceCatalog = await this.serviceCatalogRepository.findById(id);
    if (!serviceCatalog) {
      throw new ServiceCatalogNotFoundError();
    }

    serviceCatalog.activate();
    await this.serviceCatalogRepository.edit(serviceCatalog);

    return { message: 'Serviço do catálogo ativado com sucesso' };
  }
}
