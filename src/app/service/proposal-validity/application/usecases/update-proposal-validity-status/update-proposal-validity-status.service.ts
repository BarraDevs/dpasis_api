import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import type { IProposalValidityDao } from '../../persistence/dao/proposal-validity-dao.interface';

@Injectable()
export class UpdateProposalValidityStatus {
  constructor(
    @Inject(TOKENS.ProposalValidityDao) private readonly proposalValidityDao: IProposalValidityDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const proposalValidity = await this.proposalValidityDao.findById(id);
    if (!proposalValidity) {
      throw new ProposalValidityNotFoundError();
    }

    await this.proposalValidityDao.updateStatus(id, !proposalValidity.active);

    return { message: 'Status da validade atualizado com sucesso' };
  }
}
