import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceProposalValidityInUseError } from '../../../domain/errors/service-proposal-validity-in-use.error';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import type { IServiceProposalValidityDao } from '../../persistence/dao/service-proposal-validity-dao.interface';

@Injectable()
export class DeleteServiceProposalValidity {
  constructor(
    @Inject(TOKENS.ServiceProposalValidityDao) private readonly serviceProposalValidityDao: IServiceProposalValidityDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceProposalValidity = await this.serviceProposalValidityDao.findById(id);
    if (!serviceProposalValidity) {
      throw new ServiceProposalValidityNotFoundError();
    }

    const servicesCount = await this.serviceProposalValidityDao.countServicesByProposalValidityId(id);
    if (servicesCount > 0) {
      throw new ServiceProposalValidityInUseError();
    }

    await this.serviceProposalValidityDao.delete(id);

    return { message: 'Validade de proposta excluída com sucesso' };
  }
}
