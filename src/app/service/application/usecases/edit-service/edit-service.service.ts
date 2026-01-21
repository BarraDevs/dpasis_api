import { Inject, Injectable } from '@nestjs/common';
import { FindProductById } from 'src/app/product/application/usecases/find-product-by-id/find-product-by-id.service';
import { FindServiceCategoryById } from 'src/app/service-category/application/usecases/find-service-category-by-id/find-service-category-by-id.service';
import { ServiceCategoryNotActiveError } from 'src/app/service-category/domain/errors/service-category-not-active.error';
import { Service } from 'src/app/service/domain/entities/service.entity';
import { ServiceNotFoundError } from 'src/app/service/domain/errors/service-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import type { IServiceDao } from '../../persistence/dao/service-dao.interface';
import type { IServiceRepository } from '../../persistence/repository/service-repository.interface';
import { EditServiceInputDto } from './dtos/edit-service.dto';

@Injectable()
export class EditService {
  constructor(
    @Inject(TOKENS.ServiceDao) private readonly serviceDao: IServiceDao,
    @Inject(TOKENS.ServiceRepository) private readonly serviceRepository: IServiceRepository,
    private readonly findServiceCategoryById: FindServiceCategoryById,
    private readonly findProductById: FindProductById,
  ) {}

  public async execute(id: string, data: EditServiceInputDto): Promise<SuccessMessage> {
    const serviceDto = await this.serviceDao.findById(id);
    if (!serviceDto) {
      throw new ServiceNotFoundError();
    }

    if (data.categoryId && data.categoryId !== serviceDto.category.id) {
      const serviceCategory = await this.findServiceCategoryById.execute(data.categoryId);
      if (!serviceCategory.active) {
        throw new ServiceCategoryNotActiveError();
      }
    }

    const categoryId = data.categoryId !== undefined
      ? data.categoryId
      : serviceDto.category.id;

    const productIds = data.productIds !== undefined
      ? data.productIds
      : serviceDto.products.map((product) => product.id);

    if (data.productIds !== undefined) {
      await Promise.all(productIds.map((productId) => this.findProductById.execute(productId)));
    }

    const service = Service.load({
      ...serviceDto,
      ...data,
      id: serviceDto.id,
      active: serviceDto.active,
      categoryId,
      productIds,
      updatedAt: UTCDate.create().value,
    });

    await this.serviceRepository.edit(service);

    return { message: 'Serviço atualizado com sucesso!' };
  }
}
