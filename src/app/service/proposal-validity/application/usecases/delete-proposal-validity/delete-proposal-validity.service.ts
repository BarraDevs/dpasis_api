import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ProposalValidityInUseError } from '../../../domain/errors/proposal-validity-in-use.error';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import type { IProposalValidityDao } from '../../persistence/dao/proposal-validity-dao.interface';

@Injectable()
export class DeleteProposalValidity {
  constructor(
    @Inject(TOKENS.ProposalValidityDao) private readonly proposalValidityDao: IProposalValidityDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const proposalValidity = await this.proposalValidityDao.findById(id);
    if (!proposalValidity) {
      throw new ProposalValidityNotFoundError();
    }

    const servicesCount = await this.proposalValidityDao.countServicesByProposalValidityId(id);
    if (servicesCount > 0) {
      throw new ProposalValidityInUseError();
    }

    await this.proposalValidityDao.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
