import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import type { IServiceProposalValidityDao } from '../../persistence/dao/service-proposal-validity-dao.interface';

@Injectable()
export class UpdateServiceProposalValidityStatus {
  constructor(
    @Inject(TOKENS.ServiceProposalValidityDao) private readonly serviceProposalValidityDao: IServiceProposalValidityDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceProposalValidity = await this.serviceProposalValidityDao.findById(id);
    if (!serviceProposalValidity) {
      throw new ServiceProposalValidityNotFoundError();
    }

    await this.serviceProposalValidityDao.updateStatus(id, !serviceProposalValidity.active);

    return { message: 'Status da validade de proposta atualizado com sucesso' };
  }
}
