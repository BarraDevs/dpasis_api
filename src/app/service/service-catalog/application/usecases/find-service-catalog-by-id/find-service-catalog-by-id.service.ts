import { Inject, Injectable } from '@nestjs/common';
import { ServiceCatalogDto } from 'src/app/service/service-catalog/application/dtos/service-catalog.dto';
import { ServiceCatalogNotFoundError } from 'src/app/service/service-catalog/domain/errors/service-catalog-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import type { IServiceCatalogDao } from '../../persistence/dao/service-catalog-dao.interface';

@Injectable()
export class FindServiceCatalogById {
  constructor(
    @Inject(TOKENS.ServiceCatalogDao) private readonly serviceCatalogDao: IServiceCatalogDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ServiceCatalogDto> {
    const result = await this.serviceCatalogDao.findById(id);
    if (!result) {
      throw new ServiceCatalogNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new ServiceCatalogNotFoundError();
    }

    return result;
  }
}
