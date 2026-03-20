import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceFreightAlreadyExistsError } from '../../../domain/errors/service-freight-already-exists.error';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import type { IServiceFreightDao } from '../../persistence/dao/service-freight-dao.interface';
import { EditServiceFreightInputDto } from './dtos/edit-service-freight.dto';

@Injectable()
export class EditServiceFreight {
  constructor(
    @Inject(TOKENS.ServiceFreightDao) private readonly serviceFreightDao: IServiceFreightDao,
  ) {}

  public async execute(id: number, data: EditServiceFreightInputDto): Promise<SuccessMessage> {
    const serviceFreight = await this.serviceFreightDao.findById(id);
    if (!serviceFreight) {
      throw new ServiceFreightNotFoundError();
    }

    const existing = await this.serviceFreightDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ServiceFreightAlreadyExistsError(data.name);
    }

    await this.serviceFreightDao.edit(id, data);

    return { message: 'Frete de serviço atualizado com sucesso' };
  }
}
