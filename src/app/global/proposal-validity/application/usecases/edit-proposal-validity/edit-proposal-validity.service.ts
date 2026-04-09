import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ProposalValidityAlreadyExistsError } from '../../../domain/errors/proposal-validity-already-exists.error';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import type { IProposalValidityDao } from '../../persistence/dao/proposal-validity-dao.interface';
import { EditProposalValidityInputDto } from './dtos/edit-proposal-validity.dto';

@Injectable()
export class EditProposalValidity {
  constructor(
    @Inject(TOKENS.ProposalValidityDao) private readonly proposalValidityDao: IProposalValidityDao,
  ) {}

  public async execute(id: number, data: EditProposalValidityInputDto): Promise<SuccessMessage> {
    const proposalValidity = await this.proposalValidityDao.findById(id);
    if (!proposalValidity) {
      throw new ProposalValidityNotFoundError();
    }

    const existing = await this.proposalValidityDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ProposalValidityAlreadyExistsError(data.name);
    }

    await this.proposalValidityDao.edit(id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
