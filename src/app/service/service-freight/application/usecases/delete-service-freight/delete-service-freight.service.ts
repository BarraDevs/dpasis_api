import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import type { IServiceFreightDao } from '../../persistence/dao/service-freight-dao.interface';

@Injectable()
export class DeleteServiceFreight {
  constructor(
    @Inject(TOKENS.ServiceFreightDao) private readonly serviceFreightDao: IServiceFreightDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceFreight = await this.serviceFreightDao.findById(id);
    if (!serviceFreight) {
      throw new ServiceFreightNotFoundError();
    }

    await this.serviceFreightDao.delete(id);

    return { message: 'Frete de serviço excluído com sucesso' };
  }
}
