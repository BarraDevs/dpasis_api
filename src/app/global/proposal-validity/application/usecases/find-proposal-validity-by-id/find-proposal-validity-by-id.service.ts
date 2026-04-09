import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import { ProposalValidityDto } from '../../dtos/proposal-validity.dto';
import type { IProposalValidityDao } from '../../persistence/dao/proposal-validity-dao.interface';

@Injectable()
export class FindProposalValidityById {
  constructor(
    @Inject(TOKENS.ProposalValidityDao) private readonly proposalValidityDao: IProposalValidityDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ProposalValidityDto> {
    const proposalValidity = await this.proposalValidityDao.findById(id);
    if (!proposalValidity) {
      throw new ProposalValidityNotFoundError();
    }
    if (options.onlyActive && !proposalValidity.active) {
      throw new ProposalValidityNotFoundError();
    }

    return proposalValidity;
  }
}
