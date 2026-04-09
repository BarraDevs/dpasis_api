import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ProposalValidityAlreadyExistsError } from '../../../domain/errors/proposal-validity-already-exists.error';
import type { IProposalValidityDao } from '../../persistence/dao/proposal-validity-dao.interface';
import { CreateProposalValidityInputDto, CreateProposalValidityOutputDto } from './dtos/create-proposal-validity.dto';

@Injectable()
export class CreateProposalValidity {
  constructor(
    @Inject(TOKENS.ProposalValidityDao) private readonly proposalValidityDao: IProposalValidityDao,
  ) {}

  public async execute(data: CreateProposalValidityInputDto): Promise<CreateProposalValidityOutputDto> {
    const existing = await this.proposalValidityDao.findByName(data.name.trim());
    if (existing) {
      throw new ProposalValidityAlreadyExistsError(data.name);
    }

    const id = await this.proposalValidityDao.save(data);
    return { id };
  }
}
