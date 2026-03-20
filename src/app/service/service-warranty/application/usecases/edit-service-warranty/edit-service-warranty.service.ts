import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceWarrantyAlreadyExistsError } from '../../../domain/errors/service-warranty-already-exists.error';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import type { IServiceWarrantyDao } from '../../persistence/dao/service-warranty-dao.interface';
import { EditServiceWarrantyInputDto } from './dtos/edit-service-warranty.dto';

@Injectable()
export class EditServiceWarranty {
  constructor(
    @Inject(TOKENS.ServiceWarrantyDao) private readonly serviceWarrantyDao: IServiceWarrantyDao,
  ) {}

  public async execute(id: number, data: EditServiceWarrantyInputDto): Promise<SuccessMessage> {
    const serviceWarranty = await this.serviceWarrantyDao.findById(id);
    if (!serviceWarranty) {
      throw new ServiceWarrantyNotFoundError();
    }

    const existing = await this.serviceWarrantyDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ServiceWarrantyAlreadyExistsError(data.name);
    }

    await this.serviceWarrantyDao.edit(id, data);

    return { message: 'Garantia de serviço atualizada com sucesso' };
  }
}
